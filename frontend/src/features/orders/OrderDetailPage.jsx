import { useParams, Link } from "react-router";
import { ArrowLeft } from "lucide-react";

import { Seo } from "@/components/shared/Seo";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { NotFoundPage } from "@/components/shared/NotFoundPage";
import { ROUTES } from "@/constants/routes";
import { useOrder } from "./api/useOrders";
import { OrderReceipt } from "./components/OrderReceipt";

// Authenticated permanent order view — reuses the Order Placed sections (head +
// tracker + items + address + summary) without the success header.
export function OrderDetailPage() {
  const { orderNumber } = useParams();
  const { data: order, isLoading, isError } = useOrder(orderNumber);

  if (isLoading) return <FullPageLoader />;
  if (isError || !order) return <NotFoundPage />;

  return (
    <>
      <Seo title={`Order ${order.orderNumber}`} />
      <div className="mx-auto w-full max-w-[1060px] px-4 pb-8 pt-6 md:px-10 md:pb-10 md:pt-10">
        <Link
          to={ROUTES.ORDERS}
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-ink md:mb-6"
        >
          <ArrowLeft size={15} strokeWidth={2} /> My orders
        </Link>
        <OrderReceipt order={order} />
      </div>
    </>
  );
}
