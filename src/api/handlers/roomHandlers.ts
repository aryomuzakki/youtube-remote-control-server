import type { Context } from 'hono';
import { z } from 'zod';
import { createPrismaClient } from '../../services/database';
import type { CloudflareBindings } from '../../types';

// Generate a 7 character uppercase alphanumeric ID: XXXX-XX
const generateRoomId = (): string => {
  const uuid = crypto.randomUUID().replace(/-/g, '').toUpperCase();
  return `${uuid.substring(0, 4)}-${uuid.substring(4, 6)}`;
};

export const createRoomHandler = async (
  c: Context<{ Bindings: CloudflareBindings }>,
) => {
  const prisma = createPrismaClient(c.env.DB);

  // Capture caller fingerprint
  const ip =
    c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for');
  const userAgent = c.req.header('user-agent');
  const cfCountry = c.req.header('cf-ipcountry');
  const cfRay = c.req.header('cf-ray');

  let requestedRoomId: string | undefined;
  try {
    const body = await c.req.json();
    if (body && typeof body.roomId === 'string' && body.roomId.trim().length > 0) {
      requestedRoomId = body.roomId.trim();
    }
  } catch (e) {
    // Ignore JSON parse error if body is empty
  }

  const roomId = requestedRoomId || generateRoomId();

  // Check if custom room already exists to avoid unique constraint error
  if (requestedRoomId) {
    const existing = await prisma.room.findUnique({ where: { roomId } });
    if (existing) {
      return c.json({ message: 'Room already exists', roomId: existing.roomId }, 409);
    }
  }

  await prisma.$transaction([
    prisma.room.create({
      data: {
        roomId,
        status: 'WAITING',
        extensionEnabled: true,
      },
    }),
    prisma.roomFingerprint.create({
      data: {
        roomId,
        ip,
        userAgent,
        cfCountry,
        cfRay,
      },
    }),
  ]);

  return c.json({ roomId }, 201);
};

const getRoomParamsSchema = z.object({
  roomId: z.string().min(1),
});

export const getRoomHandler = async (
  c: Context<{ Bindings: CloudflareBindings }>,
) => {
  const prisma = createPrismaClient(c.env.DB);
  const { roomId } = getRoomParamsSchema.parse(c.req.param());

  const room = await prisma.room.findUnique({
    where: { roomId },
  });

  if (!room) {
    return c.json({ message: 'Room not found' }, 404);
  }

  // Parse nowPlaying if it's a valid JSON string, otherwise return as is or null
  let nowPlayingData = null;
  if (room.nowPlaying) {
    try {
      nowPlayingData = JSON.parse(room.nowPlaying);
    } catch {
      nowPlayingData = room.nowPlaying;
    }
  }

  return c.json({
    roomId: room.roomId,
    status: room.status,
    extensionEnabled: room.extensionEnabled,
    nowPlaying: nowPlayingData,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  });
};

const updateRoomBodySchema = z.object({
  extensionEnabled: z.boolean().optional(),
});

export const updateRoomHandler = async (
  c: Context<{ Bindings: CloudflareBindings }>,
) => {
  const prisma = createPrismaClient(c.env.DB);
  const { roomId } = getRoomParamsSchema.parse(c.req.param());
  
  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ message: 'Invalid JSON body' }, 400);
  }

  const parsedBody = updateRoomBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return c.json({ message: 'Invalid body parameters' }, 400);
  }

  const dataToUpdate: any = {};
  if (parsedBody.data.extensionEnabled !== undefined) {
    dataToUpdate.extensionEnabled = parsedBody.data.extensionEnabled;
  }

  if (Object.keys(dataToUpdate).length === 0) {
    return c.json({ message: 'No valid fields to update' }, 400);
  }

  try {
    const updatedRoom = await prisma.room.update({
      where: { roomId },
      data: dataToUpdate,
    });
    return c.json({
      roomId: updatedRoom.roomId,
      status: updatedRoom.status,
      extensionEnabled: updatedRoom.extensionEnabled,
    });
  } catch (e: any) {
    if (e.code === 'P2025') {
      return c.json({ message: 'Room not found' }, 404);
    }
    return c.json({ message: 'Failed to update room' }, 500);
  }
};
