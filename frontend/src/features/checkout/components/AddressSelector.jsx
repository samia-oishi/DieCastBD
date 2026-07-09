import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAddresses, useCreateAddressMutation } from "@/features/addresses/api/useAddresses";
import { AddressForm } from "@/features/addresses/components/AddressForm";

export function AddressSelector({ selectedId, onSelect }) {
  const { data: addresses, isLoading } = useAddresses();
  const createMutation = useCreateAddressMutation();
  const [addingNew, setAddingNew] = useState(false);

  const onCreate = (values) => {
    createMutation.mutate(values, {
      onSuccess: (address) => {
        setAddingNew(false);
        onSelect(address._id);
      },
      onError: () => toast.error("Could not save address"),
    });
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading addresses...</p>;

  return (
    <div className="flex flex-col gap-3">
      {addresses?.map((address) => (
        <button
          key={address._id}
          type="button"
          onClick={() => onSelect(address._id)}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
            selectedId === address._id ? "border-primary bg-primary/5" : "border-border hover:border-foreground/40"
          )}
        >
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="flex flex-col gap-0.5 text-sm">
            <span className="font-medium text-foreground">
              {address.recipientName} · {address.phone}
            </span>
            <span className="text-muted-foreground">
              {address.addressLine1}
              {address.addressLine2 && `, ${address.addressLine2}`}, {address.city}
              {address.district && `, ${address.district}`}
              {address.postalCode && ` ${address.postalCode}`}
            </span>
          </div>
        </button>
      ))}

      {addingNew ? (
        <div className="rounded-lg border border-border p-4">
          <AddressForm onSubmit={onCreate} isSubmitting={createMutation.isPending} onCancel={() => setAddingNew(false)} />
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setAddingNew(true)}>
          <Plus /> Add new address
        </Button>
      )}
    </div>
  );
}
