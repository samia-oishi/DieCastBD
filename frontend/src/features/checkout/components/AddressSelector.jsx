import { useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";
import { formatAddressLine } from "@/lib/address";
import { useAddresses, useCreateAddressMutation } from "@/features/addresses/api/useAddresses";
import { AddressForm } from "@/features/addresses/components/AddressForm";
import { OptionCard, Radio } from "./parts";

/** Saved-address cards + a dashed "Add a new address" card. Calls onSelect(address)
 * with the full address so the page can use its phone. Data/handlers unchanged.
 *
 * `collapsed` is a MOBILE-ONLY presentation flag: it hides everything except the
 * chosen address (the page's "Change" pill clears it). Desktop always shows the
 * full grid. */
export function AddressSelector({ selectedId, onSelect, collapsed = false }) {
  const { data: addresses, isLoading } = useAddresses();
  const createMutation = useCreateAddressMutation();
  const [addingNew, setAddingNew] = useState(false);

  const onCreate = (values) => {
    createMutation.mutate(values, {
      onSuccess: (address) => {
        setAddingNew(false);
        onSelect(address);
      },
      onError: () => toast.error("Could not save address"),
    });
  };

  if (isLoading) return <p className="mt-4 text-sm text-muted-foreground">Loading addresses…</p>;

  return (
    <div className="mt-3.5 flex flex-col gap-3 md:mt-4">
      <div className="grid gap-3 md:grid-cols-2">
        {addresses?.map((address) => {
          const selected = selectedId === address._id;
          return (
            <OptionCard
              key={address._id}
              variant="zone"
              selected={selected}
              onSelect={() => onSelect(address)}
              className={collapsed && !selected ? "hidden md:block" : undefined}
            >
              <div className="flex items-start gap-3">
                <Radio selected={selected} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14.5px] font-bold text-ink">{address.recipientName}</span>
                    {address.label && (
                      <span className="rounded-full bg-brand-tint px-2.5 py-[3px] text-[10.5px] font-bold uppercase tracking-[0.06em] text-brand-deep">
                        {address.label}
                      </span>
                    )}
                  </div>
                  <div className="mt-[3px] text-[13px] text-[#6B6E60]">{address.phone}</div>
                  <div className="mt-0.5 text-[13px] leading-[1.5] text-[#6B6E60]">
                    {formatAddressLine(address)}
                  </div>
                </div>
              </div>
            </OptionCard>
          );
        })}

        {!addingNew && (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className={cn(
              "flex min-h-[88px] items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-[#C9CBBE] text-[13.5px] font-semibold text-[#6B6E60] transition-colors duration-150 hover:border-brand hover:text-ink",
              collapsed && "hidden md:flex"
            )}
          >
            <Plus size={15} strokeWidth={2.2} /> Add a new address
          </button>
        )}
      </div>

      {addingNew && (
        <div className="rounded-[14px] border border-line bg-[#FAFAF7] p-4">
          <AddressForm onSubmit={onCreate} isSubmitting={createMutation.isPending} onCancel={() => setAddingNew(false)} />
        </div>
      )}
    </div>
  );
}
