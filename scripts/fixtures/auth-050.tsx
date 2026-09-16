import { createRoot } from "react-dom/client";
import { PasswordChangeForm } from "../../components/auth/account-forms";

const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");

createRoot(root).render(
  <main className="mx-auto max-w-md px-5 py-6">
    <h1 className="app-page-title">账号与偏好</h1>
    <section className="surface-card mt-7 rounded-[1.65rem] p-5">
      <h2 className="app-section-title">账号安全</h2>
      <details className="mt-4 rounded-[1.2rem] border border-[var(--hairline)] bg-[var(--surface-solid)] px-4">
        <summary className="cursor-pointer py-4 text-sm font-semibold">
          修改密码
        </summary>
        <div className="pb-4">
          <PasswordChangeForm />
        </div>
      </details>
    </section>
  </main>,
);
