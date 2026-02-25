import { cookies } from "next/headers";

import AdminLoginGate from "./AdminLoginGate";
import AdminStoreSubmissionsClient from "./AdminStoreSubmissionsClient";
import styles from "./page.module.css";

import {
  ADMIN_SESSION_COOKIE,
  getConfiguredAdminAccessKey,
  isValidAdminAccessKey,
} from "@/lib/admin-auth";

export default function AdminStoreSubmissionsPage() {
  const configured = getConfiguredAdminAccessKey();

  if (!configured) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <section className={styles.errorBox}>
            <h1>Admin access not configured</h1>
            <p>Set `ADMIN_ACCESS_KEY` in `/Users/edgar/Documents/01 Projects/ThriftStoreDirectory/app/.env`.</p>
          </section>
        </div>
      </main>
    );
  }

  const adminCookie = cookies().get(ADMIN_SESSION_COOKIE)?.value ?? "";
  if (!isValidAdminAccessKey(adminCookie)) return <AdminLoginGate />;

  return <AdminStoreSubmissionsClient />;
}
