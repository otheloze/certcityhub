import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
import { CurrentUserPayload } from "../../common/decorators/current-user.decorator";

interface JwtPayload {
  sub: string;
  email: string;
  role: CurrentUserPayload["role"];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET") ?? "dev-only-change-me",
    });
  }

  validate(payload: JwtPayload): CurrentUserPayload {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
