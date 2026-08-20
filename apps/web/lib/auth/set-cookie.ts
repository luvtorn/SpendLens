export function forwardSetCookies(source: Response, target: Response): void {
  for (const cookie of source.headers.getSetCookie()) {
    target.headers.append("set-cookie", cookie);
  }
}
