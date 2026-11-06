"use client";

import { useActionState } from "react";
import { signIn, signOut, signUp } from "@/app/actions/auth";
import type { ActionResult } from "@/lib/commerce/types";

const initial: ActionResult | null = null;

export function SignInForm({ accountsOpen }: { accountsOpen: boolean }) {
  const [state, action, pending] = useActionState(signIn, initial);
  return (
    <form action={action} className="stack">
      <h2>Sign in</h2>
      {!accountsOpen ? <p className="notice">Accounts are not open until Supabase Auth is configured. This form will not sign anyone in.</p> : null}
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required disabled={!accountsOpen} />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required disabled={!accountsOpen} />
      </label>
      {state && !state.ok ? <p className="error">{state.message}</p> : null}
      <button className="btn" type="submit" disabled={!accountsOpen || pending}>
        Sign in
      </button>
    </form>
  );
}

export function SignUpForm({ accountsOpen }: { accountsOpen: boolean }) {
  const [state, action, pending] = useActionState(signUp, initial);
  return (
    <form action={action} className="stack">
      <h2>Create an account</h2>
      <p className="help">New accounts are customers. Selling requires a separate application and approval.</p>
      {!accountsOpen ? <p className="notice">Account creation is not open. Submitting will not create an account.</p> : null}
      <label className="field">
        <span>Name</span>
        <input name="displayName" autoComplete="name" disabled={!accountsOpen} />
      </label>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required disabled={!accountsOpen} />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="new-password" minLength={8} required disabled={!accountsOpen} />
      </label>
      {state ? <p className={state.ok ? "good" : "error"}>{state.message}</p> : null}
      <button className="btn" type="submit" disabled={!accountsOpen || pending}>
        Create account
      </button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button className="btn secondary" type="submit">
        Sign out
      </button>
    </form>
  );
}
