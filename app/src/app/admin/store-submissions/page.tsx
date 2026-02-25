import Link from "next/link";

import AdminStoreSubmissionsClient from "./AdminStoreSubmissionsClient";
import styles from "./page.module.css";

import { getConfiguredAdminAccessKey, isValidAdminAccessKey } from "@/lib/admin-auth";

type PageProps = {
  searchParams?: {
    adminKey?: string | string[];
  };
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function AdminStoreSubmissionsPage({ searchParams }: PageProps) {
  const adminKey = firstValue(searchParams?.adminKey) ?? "";
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

  if (!isValidAdminAccessKey(adminKey)) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <section className={styles.errorBox}>
            <h1>Admin access denied</h1>
            <p>
              Open this page with `?adminKey=...` using the configured `ADMIN_ACCESS_KEY` value.
            </p>
            <p>
              Example: <code>/admin/store-submissions?adminKey=your-key</code>
            </p>
            <p>
              <Link href="/">Return to directory</Link>
            </p>
          </section>
        </div>
      </main>
    );
  }

  return <AdminStoreSubmissionsClient adminKey={adminKey} />;
}
