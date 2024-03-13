import { NextRequest, NextResponse } from "next/server";

const isAuthenticated = (req: NextRequest) => {
  const BASIC_USER = process.env.BASIC_USER;
  const BASIC_PASSWORD = process.env.BASIC_PASSWORD;

  if (!BASIC_USER || !BASIC_PASSWORD) {
    return true
  }

  const basicAuth = req.headers.get("authorization");
  if (!basicAuth) {
    return false;
  }

  const authValue = basicAuth.split(" ")[1];
  const [user, pwd] = Buffer.from(authValue, "base64").toString().split(":");

  if (user !== BASIC_USER || pwd !== BASIC_PASSWORD) {
    return false;
  }

  return true;
}

export function middleware(req: NextRequest) {

  if (!isAuthenticated(req)) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'authentication failed' }),
      { 
        status: 401, 
        headers: { 
          'content-type': 'application/json',
          "WWW-authenticate": 'Basic realm="Secure Area"',
        } 
      }
    )
  }
}