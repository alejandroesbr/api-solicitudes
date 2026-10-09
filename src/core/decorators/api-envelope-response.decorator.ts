import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

interface ApiEnvelopeResponseOptions {
  isArray?: boolean;
  status?: number;
  description?: string;
}

export const ApiEnvelopeResponse = <TModel extends Type<any>>(
  model: TModel,
  options?: ApiEnvelopeResponseOptions,
) => {
  const isArray = options?.isArray ?? false;
  const status = options?.status ?? 200;

  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      description: options?.description,
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: isArray
            ? {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              }
            : {
                $ref: getSchemaPath(model),
              },
          path: { type: 'string', example: '/solicitudes' },
          timestamp: { type: 'string', example: '2026-10-09T15:00:00.000Z' },
        },
        required: ['success', 'data', 'path', 'timestamp'],
      },
    }),
  );
};
