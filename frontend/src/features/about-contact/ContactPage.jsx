import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { Mail, Clock, Send } from "lucide-react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { Seo } from "@/components/shared/Seo";
import { FacebookIcon, InstagramIcon, YouTubeIcon, WhatsAppIcon } from "@/components/shared/SocialIcons";
import { useSettings } from "@/features/settings/api/useSettings";
import { contactSchema } from "./schemas/contactSchema";
import { useSubmitContactMessageMutation } from "./api/useContact";

// Design copy is the shipped default; real admin-configured values win when set.
const DEFAULTS = {
  email: "support@diecastbd.com",
  instagram: "https://www.instagram.com/diecastbd.official",
  facebook: "https://www.facebook.com/diecastbd.official",
  youtube: "https://www.youtube.com/@diecastbd",
};

const inputCls =
  "w-full rounded-[12px] border border-line bg-paper px-[15px] py-[13px] text-base leading-[1.2] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:text-[13.5px]";

function Field({ label, hint, error, children, className }) {
  return (
    <div className={className}>
      <div className="mb-[7px] text-[12.5px] font-semibold text-ink">
        {label} {hint && <span className="font-medium text-faint">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

function ChannelCard({ icon, title, sub, action }) {
  return (
    <div className="flex items-center gap-3.5 rounded-[18px] border border-line bg-white p-[18px_20px]">
      <div className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-[#EFF5DC] text-brand-deep">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-bold text-ink">{title}</div>
        <div className="mt-0.5 text-[12.5px] text-muted-foreground">{sub}</div>
      </div>
      {action}
    </div>
  );
}

const SOCIAL_CIRCLE = "flex size-9 items-center justify-center rounded-full border border-white/[0.18] text-[#DDDFD2] hover:text-white";

export function ContactPage() {
  const { data: settings } = useSettings();
  const social = settings?.socialLinks ?? {};
  const email = settings?.contactInfo?.email || DEFAULTS.email;
  const instagram = social.instagram || DEFAULTS.instagram;
  const facebook = social.facebook || DEFAULTS.facebook;
  const youtube = social.youtube || DEFAULTS.youtube;
  const whatsapp = social.whatsapp; // real number/url only — no fabricated default
  const igHandle = instagram.replace(/\/$/, "").split("/").pop();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(contactSchema) });
  const submitMutation = useSubmitContactMessageMutation();

  const onSubmit = (values) =>
    submitMutation.mutate(values, {
      onSuccess: () => { toast.success("Message sent — we'll get back to you soon."); reset(); },
      onError: (err) => toast.error(err.response?.data?.message ?? "Could not send message"),
    });

  return (
    <>
      <Seo title="Contact" description="Talk to a collector — order questions, authenticity checks, or casting hunts." />
      <div className="mx-auto w-full max-w-[1160px] px-4 pb-10 pt-8 md:px-6 md:pt-11">
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink md:text-[38px]">Talk to a collector.</h1>
        <p className="mt-2.5 max-w-[520px] text-[15px] leading-[1.6] text-muted-foreground">
          Order question, authenticity check, or hunting a specific casting — we usually reply within the hour.
        </p>

        <div className="mt-8 grid items-start gap-6 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">
          {/* channels */}
          <div className="flex flex-col gap-3">
            {whatsapp && (
              <ChannelCard
                icon={<WhatsAppIcon className="size-[19px]" />}
                title="WhatsApp — fastest"
                sub="Usually replies within the hour, 10am–10pm"
                action={
                  <a href={/^https?:/.test(whatsapp) ? whatsapp : `https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full border-[1.5px] border-ink px-3.5 py-2 text-xs font-bold text-ink transition-colors hover:bg-ink hover:text-white">Chat</a>
                }
              />
            )}
            <a href={`mailto:${email}`}><ChannelCard icon={<Mail size={19} strokeWidth={1.8} />} title="Email" sub={`${email} — within 24h`} /></a>
            <a href={instagram} target="_blank" rel="noopener noreferrer"><ChannelCard icon={<InstagramIcon className="size-[19px]" />} title="Instagram" sub={`@${igHandle} — drops & DMs`} /></a>

            <div className="flex items-center justify-between gap-3.5 rounded-[18px] bg-ink p-[16px_20px]">
              <div className="text-sm font-bold text-white">Follow DiecastBD</div>
              <div className="flex gap-2">
                <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={SOCIAL_CIRCLE}><FacebookIcon className="size-[15px]" /></a>
                <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={SOCIAL_CIRCLE}><InstagramIcon className="size-[15px]" /></a>
                <a href={youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className={SOCIAL_CIRCLE}><YouTubeIcon className="size-4" /></a>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[18px] bg-ink p-[18px_20px]">
              <Clock size={17} strokeWidth={1.8} className="shrink-0 text-brand" />
              <div className="text-[13px] leading-[1.5] text-[#C7C9BC]">
                Ordering? Include your <span className="font-bold text-white">order ID</span> and we'll pull it up instantly.
              </div>
            </div>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="rounded-[24px] border border-line bg-white p-[26px]">
            <div className="font-display text-lg font-bold text-ink">Send a message</div>
            <div className="mt-[18px] grid gap-3.5 sm:grid-cols-2">
              <Field label="Name" error={errors.name?.message}>
                <input {...register("name")} placeholder="Your name" className={inputCls} />
              </Field>
              <Field label="Email or phone" error={errors.contact?.message}>
                <input {...register("contact")} placeholder="How do we reach you?" className={inputCls} />
              </Field>
            </div>
            <Field label="Order ID" hint="(optional)" error={errors.orderId?.message} className="mt-3.5">
              <input {...register("orderId")} placeholder="DBD-XXXXXXXX-XXXXXX" className={inputCls} />
            </Field>
            <Field label="Message" error={errors.message?.message} className="mt-3.5">
              <textarea {...register("message")} rows={4} placeholder="What can we help with?" className={cn(inputCls, "min-h-[110px]")} />
            </Field>
            <button type="submit" disabled={submitMutation.isPending} className="mt-[18px] flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-brand text-[14.5px] font-bold text-ink transition-colors hover:bg-brand-bright disabled:opacity-60">
              {submitMutation.isPending ? "Sending…" : <>Send message <Send size={15} strokeWidth={2.2} /></>}
            </button>
          </form>
        </div>

        <div className="mt-9 text-center text-[13.5px] text-muted-foreground">
          Quick answers live in the <Link to={ROUTES.FAQ} className="font-bold text-ink">FAQ</Link>.
        </div>
      </div>
    </>
  );
}
