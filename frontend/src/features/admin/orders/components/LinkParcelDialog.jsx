import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { adminInputCls } from "@/features/admin/shell/adminFieldCls";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";

/** Attaches a parcel the merchant booked directly in Steadfast's panel.
 *
 * Not every order starts here — a Facebook or phone order is often entered at
 * the courier first. Linking it means the same order shows live progress
 * without pretending we created the consignment.
 *
 * The backend checks the id against Steadfast before saving, so a typo is
 * rejected rather than sitting on the order looking authoritative while
 * tracking silently never works.
 */
export function LinkParcelDialog({ order, open, onOpenChange, onSubmit, isPending }) {
  const [consignmentId, setConsignmentId] = useState("");
  const [trackingCode, setTrackingCode] = useState("");

  useEffect(() => {
    if (open) {
      setConsignmentId("");
      setTrackingCode("");
    }
  }, [open]);

  if (!order) return null;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title={`Link a Steadfast parcel · ${order.orderNumber}`}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-ink-soft">
          For a parcel you already created in Steadfast. The number is checked against them before it&apos;s saved.
        </p>

        <div>
          <div className="mb-1.5 text-[12.5px] font-semibold text-ink">Consignment ID</div>
          <Input
            value={consignmentId}
            onChange={(e) => setConsignmentId(e.target.value)}
            className={adminInputCls}
            placeholder="e.g. 1424107"
            inputMode="numeric"
          />
        </div>

        <div>
          <div className="mb-1.5 text-[12.5px] font-semibold text-ink">
            Tracking code <span className="font-medium text-faint">(optional)</span>
          </div>
          <Input
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            className={adminInputCls}
            placeholder="e.g. 15BAEB8A"
          />
        </div>

        <div className="flex justify-end gap-1">
          <AdminButton variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</AdminButton>
          <AdminButton
            variant="primary"
            disabled={!consignmentId.trim() || isPending}
            onClick={() => onSubmit({ consignmentId: consignmentId.trim(), trackingCode: trackingCode.trim() || undefined })}
          >
            {isPending ? "Checking…" : "Link parcel"}
          </AdminButton>
        </div>
      </div>
    </ResponsiveModal>
  );
}
