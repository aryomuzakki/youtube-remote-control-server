import { Hono } from 'hono';
import type { CloudflareBindings } from '../types';
import { createRoomHandler, getRoomHandler } from './handlers/roomHandlers';

const roomsRouter = new Hono<{ Bindings: CloudflareBindings }>({
  strict: false,
});

roomsRouter.post('/', createRoomHandler);
roomsRouter.get('/:roomId', getRoomHandler);

export default roomsRouter;
