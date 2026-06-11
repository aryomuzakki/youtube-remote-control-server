import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

export const routingErrorHandler = (err: unknown, c: Context) => {
  if (err instanceof ZodError) {
    let message = '';
    for (const issue of err.issues) {
      message += `${String(issue.path[0])} ${issue.message.toLowerCase()}. `;
    }
    return c.json(
      {
        message,
        fieldErrors: err.flatten().fieldErrors,
        formErrors: err.flatten().formErrors,
      },
      400,
    );
  }

  const errorObj = err as { name?: string; message?: string; stack?: string };

  if (errorObj?.name === 'PrismaClientInitializationError') {
    console.error(
      'PrismaClientInitializationError',
      errorObj.message,
      errorObj.stack,
    );
    return c.json({ message: errorObj.message }, 500);
  }
  if (errorObj?.name === 'PrismaClientKnownRequestError') {
    console.error('PrismaClientKnownRequestError', errorObj.message);
    return c.json({ message: errorObj.message }, 500);
  }
  if (errorObj?.name === 'PrismaClientRustPanicError') {
    console.error('PrismaClientRustPanicError', errorObj.message);
    return c.json({ message: errorObj.message }, 500);
  }
  if (errorObj?.name === 'PrismaClientUnknownRequestError') {
    console.error('PrismaClientUnknownRequestError', errorObj.message);
    return c.json({ message: errorObj.message }, 500);
  }
  if (errorObj?.name === 'PrismaClientValidationError') {
    console.error('PrismaClientValidationError', errorObj.message);
    return c.json({ message: errorObj.message }, 400);
  }
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
  if (err instanceof Error) {
    console.error('Error', err.message, err.stack);
    return c.json({ message: err.message }, 500);
  }

  return c.json({ message: 'Unknown error occurred' }, 500);
};
