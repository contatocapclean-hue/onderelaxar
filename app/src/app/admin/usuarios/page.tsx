import { getAllUsersForAdmin } from "@/lib/admin-data";

export default async function AdminUsuariosPage() {
  const users = await getAllUsersForAdmin();

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl text-foreground">Usuários</h1>
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface card-shadow">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="p-3">Nome</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Função</th>
              <th className="p-3">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium text-foreground">{u.name || "—"}</td>
                <td className="p-3 text-muted-foreground">{u.email}</td>
                <td className="p-3">
                  <span className="rounded-full bg-beige px-2.5 py-1 text-xs">
                    {u.role === "admin" ? "Administrador" : "Profissional"}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {new Intl.DateTimeFormat("pt-BR").format(new Date(u.createdAt))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
