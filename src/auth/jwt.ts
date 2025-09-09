import jwt from 'jsonwebtoken';
import { env } from '../env';

export type JwtPayload = { userId: string; role: 'admin' | 'user'; orgId: string };

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}


