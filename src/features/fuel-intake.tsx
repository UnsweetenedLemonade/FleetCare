import { useState } from "react";
import { useNavigate } from "react-router";
import { useFleet } from "../app/context";
import { Dialog, Form, Notice } from "../components/ui";
import { localTime, toUtc } from "../lib/format";
export function FuelIntakeDialog({ vehicleId }: { vehicleId?: string }) {
  const { s, actor, run, upload, close } = useFleet(),
    navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]),
    [id] = useState(() => crypto.randomUUID()),
    [saved, setSaved] = useState(false);
  return (
    <Dialog
      title="Nahrát tankovací účtenku"
      onClose={close}
      dirty={files.length > 0}
    >
      <div className="dialog-body">
        <Notice>
          Vyberte vlastníka a skutečný čas transakce. Litry ani částku z
          nepřipojené extrakce nedoplňujeme. Neúplný záznam pak můžete doplnit
          ručně.
        </Notice>
        <Form
          fields={[
            {
              key: "vehicleId",
              label: "Vozidlo",
              type: "select",
              required: true,
              options: s.vehicles.map((v) => [v.id, v.spz]),
            },
            {
              key: "driverId",
              label: "Řidič",
              type: "select",
              required: true,
              options: s.drivers.map((d) => [d.id, d.name]),
            },
            {
              key: "at",
              label: "Skutečný čas transakce",
              type: "datetime",
              required: true,
              initial: localTime(),
            },
          ]}
          initial={{
            vehicleId: vehicleId || "",
            driverId: actor.driverId || "",
          }}
          submit="Uložit účtenku"
          onSubmit={async (values) => {
            if (!files.length) throw new Error("Vyberte účtenku.");
            await run(
              {
                type: "save",
                collection: "fuels",
                data: {
                  ...values,
                  id,
                  at: toUtc(String(values.at)),
                  full: "Není doloženo",
                  state: "Neúplný podklad",
                },
              },
              id + "-record",
            );
            setSaved(true);
            await upload({
              ownerType: "fuel",
              ownerId: id,
              vehicleId: String(values.vehicleId),
              type: "Účtenka",
              files,
              idempotencyKey: id + "-file",
            });
            close();
            navigate(`/fuels/${id}`);
          }}
        >
          <label className="upload-zone">
            Účtenka PDF / JPG / PNG
            <input
              aria-label="Vybrat účtenku"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </label>
          <label>
            Vyfotit účtenku
            <input
              aria-label="Vyfotit účtenku"
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </label>
          {files.map((f, i) => (
            <p key={i}>{f.name}</p>
          ))}
          {saved && (
            <Notice>
              Neúplné tankování je uloženo. Při chybě přílohy můžete nahrání
              zopakovat bez vytvoření druhého záznamu.
            </Notice>
          )}
        </Form>
      </div>
    </Dialog>
  );
}
