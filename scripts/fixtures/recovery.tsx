import { createRoot } from "react-dom/client";
import RecoverPage from "../../app/auth/recover/page";
import PrivacyPage from "../../app/privacy/page";
import SupportPage from "../../app/support/page";
import { RecoveryForm } from "../../components/auth/recovery-form";
import { SessionBootstrap } from "../../components/session-bootstrap";

const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
const path = window.location.pathname;
createRoot(root).render(
  <main>
    <SessionBootstrap isReady={false} />
    {path === "/support" ? (
      <SupportPage />
    ) : path === "/privacy" ? (
      <PrivacyPage />
    ) : path === "/auth/recover" ? (
      <RecoverPage />
    ) : (
      <div className="mx-auto max-w-lg px-5 py-5">
        <h1 className="app-page-title">找回密码</h1>
        <RecoveryForm />
      </div>
    )}
  </main>,
);
