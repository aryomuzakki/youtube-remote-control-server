import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import type { CloudflareBindings } from '../types';
import { createRoomHandler, getRoomHandler, updateRoomHandler } from './handlers/roomHandlers.ts';

const roomsRouter = new OpenAPIHono<{ Bindings: CloudflareBindings }>({
  strict: false,
});

const RoomSchema = z.object({
  roomId: z.string(),
  status: z.string(),
  extensionEnabled: z.boolean(),
  nowPlaying: z.any().nullable(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

roomsRouter.openapi(
  createRoute({
    method: 'post',
    path: '/',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              roomId: z.string().optional(),
            }),
          },
        },
        required: false,
      },
    },
    responses: {
      201: { description: 'Room created', content: { 'application/json': { schema: z.object({ roomId: z.string() }) } } },
      409: { description: 'Room already exists', content: { 'application/json': { schema: z.object({ message: z.string(), roomId: z.string() }) } } },
    },
  }),
  createRoomHandler
);

roomsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/{roomId}',
    request: {
      params: z.object({
        roomId: z.string(),
      }),
    },
    responses: {
      200: { description: 'Room details', content: { 'application/json': { schema: RoomSchema } } },
      404: { description: 'Room not found', content: { 'application/json': { schema: z.object({ message: z.string() }) } } },
    },
  }),
  getRoomHandler as any
);

roomsRouter.openapi(
  createRoute({
    method: 'patch',
    path: '/{roomId}',
    request: {
      params: z.object({
        roomId: z.string(),
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              extensionEnabled: z.boolean().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: { description: 'Room updated', content: { 'application/json': { schema: RoomSchema } } },
      400: { description: 'Invalid request', content: { 'application/json': { schema: z.object({ message: z.string() }) } } },
      404: { description: 'Room not found', content: { 'application/json': { schema: z.object({ message: z.string() }) } } },
      500: { description: 'Server error', content: { 'application/json': { schema: z.object({ message: z.string() }) } } },
    },
  }),
  updateRoomHandler as any
);

export default roomsRouter;
