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

  const roomId = generateRoomId();

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
