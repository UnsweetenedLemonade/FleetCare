import { useState, type FormEvent } from "react";
import { Truck } from "lucide-react";
import { Button, Notice } from "../components/ui";

export function LoginPage({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onLogin(email.trim(), password);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Přihlášení selhalo.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-screen">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand-mark" aria-hidden="true">
          <Truck size={25} />
        </div>
        <p className="login-eyebrow">FleetCare</p>
        <h1 id="login-title">Přihlášení</h1>
        <p className="login-intro">
          Přihlaste se svým účtem a pokračujte do aplikace.
        </p>
        <form className="login-form" onSubmit={(event) => void submit(event)}>
          <label>
            E-mail
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Heslo
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <Notice error>{error}</Notice>}
          <Button primary disabled={busy} type="submit">
            {busy ? "Přihlašování…" : "Přihlásit se"}
          </Button>
        </form>
      </section>
    </main>
  );
}
