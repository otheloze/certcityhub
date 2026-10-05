import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Role } from "@examproject/shared-types";

export interface CurrentUserPayload {
  userId: string;
  email: string;
  role: Role;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
