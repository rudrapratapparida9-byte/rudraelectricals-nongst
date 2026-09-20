import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password, action } = await request.json();

    if (action === "logout") {
      const response = NextResponse.json({ success: true, message: "Logged out successfully" });
      response.cookies.delete("rudra_session");
      return response;
    }

    const rawEmail = (email || "").trim().toLowerCase();
    const cleanEmail = rawEmail.replace(/@/g, "").replace(/\./g, "");
    const trimmedPassword = (password || "").trim();

    // Owner Accounts: rudrapratap9@gmail.com, rudra@electrical.com, owner, owner@electrical.com
    const isOwner =
      rawEmail === "rudrapratap9@gmail.com" ||
      cleanEmail === "rudrapratap9gmailcom" ||
      rawEmail === "rudra@electrical.com" ||
      rawEmail === "owner" ||
      rawEmail === "owner@electrical.com" ||
      rawEmail === "admin";

    // Employee / Staff Accounts: rudrapratapparida88@gmail.com, employee@electrical.com, staff, employee
    const isEmployee =
      rawEmail === "rudrapratapparida88@gmail.com" ||
      rawEmail === "rudrapratapparida88gmail.com" ||
      cleanEmail === "rudrapratapparida88gmailcom" ||
      rawEmail === "employee@electrical.com" ||
      rawEmail === "staff@electrical.com" ||
      rawEmail === "employee" ||
      rawEmail === "staff";

    if (isOwner) {
      if (
        trimmedPassword !== "Rudra@1234" &&
        trimmedPassword !== "Rusra@1234" &&
        trimmedPassword !== "admin123" &&
        trimmedPassword !== "owner123"
      ) {
        return NextResponse.json(
          { success: false, error: "Incorrect password. Please check your owner password and try again." },
          { status: 401 }
        );
      }

      const sessionData = {
        id: "owner-rudra-01",
        email: rawEmail.includes("@") ? rawEmail : "rudrapratap9@gmail.com",
        full_name: "Rabindra Kumar Parida (Owner)",
        role: "owner",
        is_active: true,
        login_at: new Date().toISOString(),
      };

      const response = NextResponse.json({
        success: true,
        user: sessionData,
        redirectTo: "/dashboard",
        message: "Signed in as Shop Owner",
      });

      response.cookies.set("rudra_session", JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return response;
    }

    if (isEmployee) {
      if (
        trimmedPassword !== "Kanha@123" &&
        trimmedPassword !== "staff123" &&
        trimmedPassword !== "employee123" &&
        trimmedPassword !== "123456"
      ) {
        return NextResponse.json(
          { success: false, error: "Incorrect password. Please check your employee password and try again." },
          { status: 401 }
        );
      }

      const sessionData = {
        id: "employee-rudra-02",
        email: rawEmail.includes("@") ? rawEmail : "rudrapratapparida88@gmail.com",
        full_name: "Rudra Pratap Parida (Employee)",
        role: "billing_staff",
        is_active: true,
        login_at: new Date().toISOString(),
      };

      const response = NextResponse.json({
        success: true,
        user: sessionData,
        redirectTo: "/billing",
        message: "Signed in as Employee / Billing Staff",
      });

      response.cookies.set("rudra_session", JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

    // Generic fallback for any email containing "employee" or "staff" vs "owner"
    if (rawEmail.includes("employee") || rawEmail.includes("staff")) {
      const sessionData = {
        id: "employee-staff-" + Date.now(),
        email: rawEmail,
        full_name: "Staff Member",
        role: "billing_staff",
        is_active: true,
        login_at: new Date().toISOString(),
      };
      const response = NextResponse.json({
        success: true,
        user: sessionData,
        redirectTo: "/billing",
        message: "Signed in as Employee",
      });
      response.cookies.set("rudra_session", JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }

    // Reject unknown credentials
    return NextResponse.json(
      {
        success: false,
        error: "Invalid email or password. Please verify your credentials and try again.",
      },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Login failed" },
      { status: 400 }
    );
  }
}
