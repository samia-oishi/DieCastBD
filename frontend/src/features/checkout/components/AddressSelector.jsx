import { useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";
import { useAddresses, useCreateAddressMutation } from "@/features/addresses/api/useAddresses";
import { AddressForm } from "@/features/addresses/components/AddressForm";
import { RadioDot } from "./parts";

/** Saved-address radio cards + a dashed "Add new address" card. Calls
 * onSelect(address) with the full address so the page can use its phone. */
export function AddressSelector({ selectedId, onSelect }) {
  const { data: addresses, isLoading } = useAddresses();
  const createMutation = useCreateAddressMutation();
  const [addingNew, setAddingNew] = useState(false);

  const onCreate = (values) => {
    createMutation.mutate(values, {
      onSuccess: (address) => { setAddingNew(false); onSelect(address); },
      onError: () => toast.error("Could not save address"),
    });
  };

  if (isLoading) return <p className="mt-5 text-sm text-muted-foreground">Loading addresses…</p>;

  return (
    <div className="mt-[18px] flex flex-col gap-3.5">
      <div className="flex flex-wrap gap-3.5">
        {addresses?.map((address) => {
          const selected = selectedId === address._id;
          return (
            <div
              key={address._id}
              onClick={() => onSelect(address)}
              role="radio"
              aria-checked={selected}
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(address))}
              className={cn(
                "flex min-w-[260px] flex-1 cursor-pointer gap-3 rounded-[16px] p-4 md:p-[16px_18px]",
                selected ? "border-[1.5px] border-brand bg-[#FBFDF3]" : "border border-line bg-white hover:border-ink"
              )}
            >
              <RadioDot selected={selected} />
              <div>
                <div className="text-sm font-bold text-ink">{address.recipientName} · {address.phone}</div>
                <div className="mt-1 text-[13px] leading-[1.5] text-muted-foreground">
                  {address.addressLine1}, {address.city}
                  {address.district && `, ${address.district}`}
                  {address.postalCode && ` ${address.postalCode}`}
                </div>
              </div>
            </div>
          );
        })}

        {!addingNew && (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="flex min-w-[220px] flex-1 items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-dashed border-[#DDDFD2] p-4 text-[13.5px] font-semibold text-muted-foreground transition-colors hover:border-ink hover:text-ink"
          >
            <Plus size={15} strokeWidth={2.2} /> Add new address
          </button>
        )}
      </div>

      {addingNew && (
        <div className="rounded-[16px] border border-line bg-paper p-4">
          <AddressForm onSubmit={onCreate} isSubmitting={createMutation.isPending} onCancel={() => setAddingNew(false)} />
        </div>
      )}
    </div>
  );
}
