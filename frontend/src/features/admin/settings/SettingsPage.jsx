import { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { Plus, Trash2, ImageUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { ICON_MAP } from "@/features/home/components/WhyChooseUsSection";
import { useSettings } from "@/features/settings/api/useSettings";
import { useUpdateSettingsMutation, useUploadSettingsImageMutation } from "./api/useAdminSettings";

const ICON_NAMES = Object.keys(ICON_MAP);

function SectionCard({ title, description, children }) {
  return (
    <div className="rounded-lg border border-border p-6">
      <h2 className="font-heading text-lg">{title}</h2>
      {description && <p className="mb-4 mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </div>
  );
}

function HeroSlideImage({ control, index }) {
  const uploadMutation = useUploadSettingsImageMutation();

  return (
    <Controller
      control={control}
      name={`heroBanner.${index}.image`}
      render={({ field }) => (
        <div className="flex items-center gap-3">
          {field.value?.url ? (
            <img src={field.value.url} alt="" className="size-14 rounded object-cover" />
          ) : (
            <div className="flex size-14 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
              No image
            </div>
          )}
          <Button variant="outline" size="sm" asChild disabled={uploadMutation.isPending}>
            <label className="cursor-pointer">
              <ImageUp /> {uploadMutation.isPending ? "Uploading..." : "Upload"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const uploaded = await uploadMutation.mutateAsync(file);
                    field.onChange(uploaded);
                  } catch {
                    toast.error("Upload failed");
                  }
                }}
              />
            </label>
          </Button>
        </div>
      )}
    />
  );
}

const HOMEPAGE_SECTIONS = [
  { key: "collectorPicks", label: "Collector Picks" },
  { key: "featuredProducts", label: "Featured Products" },
  { key: "brandsStrip", label: "Brands Strip" },
  { key: "newArrivals", label: "New Arrivals" },
  { key: "whyChooseUs", label: "Why Choose Us" },
  { key: "collectorPromise", label: "Collector Promise" },
  { key: "testimonials", label: "Testimonials" },
  { key: "instagramFeed", label: "Instagram" },
  { key: "newsletter", label: "Newsletter Signup" },
];

function SectionToggleRow({ control, name, label }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm">
          {label}
          <Switch checked={field.value} onCheckedChange={field.onChange} />
        </label>
      )}
    />
  );
}

function BkashQrImage({ control }) {
  const uploadMutation = useUploadSettingsImageMutation();

  return (
    <Controller
      control={control}
      name="bkashConfig.qrImage"
      render={({ field }) => (
        <div className="flex items-center gap-3">
          {field.value?.url ? (
            <img src={field.value.url} alt="" className="size-20 rounded object-cover" />
          ) : (
            <div className="flex size-20 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
              No QR
            </div>
          )}
          <Button variant="outline" size="sm" asChild disabled={uploadMutation.isPending}>
            <label className="cursor-pointer">
              <ImageUp /> {uploadMutation.isPending ? "Uploading..." : "Upload QR"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const uploaded = await uploadMutation.mutateAsync(file);
                    field.onChange(uploaded);
                  } catch {
                    toast.error("Upload failed");
                  }
                }}
              />
            </label>
          </Button>
        </div>
      )}
    />
  );
}

export function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettingsMutation();

  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      heroBanner: [],
      announcementBar: { text: "", isActive: false },
      whyChooseUs: [],
      collectorPromise: { title: "", description: "" },
      testimonials: [],
      socialLinks: { facebook: "", instagram: "", whatsapp: "" },
      contactInfo: { email: "", phone: "", address: "" },
      shippingZones: [],
      freeShippingThreshold: 0,
      bkashConfig: { merchantNumber: "", qrImage: null },
      homepageSections: {
        hero: { enabled: true, autoplay: true, autoplayInterval: 6 },
        collectorPicks: { enabled: true },
        featuredProducts: { enabled: true },
        brandsStrip: { enabled: true },
        newArrivals: { enabled: true },
        whyChooseUs: { enabled: true },
        collectorPromise: { enabled: true },
        testimonials: { enabled: true },
        instagramFeed: { enabled: true },
        newsletter: { enabled: true },
      },
      navigation: { headerLinks: [], footerLinks: [], footerText: "" },
      seoDefaults: { title: "", description: "" },
      faqs: [],
    },
  });

  const heroBanner = useFieldArray({ control, name: "heroBanner" });
  const whyChooseUs = useFieldArray({ control, name: "whyChooseUs" });
  const testimonials = useFieldArray({ control, name: "testimonials" });
  const faqs = useFieldArray({ control, name: "faqs" });
  const shippingZones = useFieldArray({ control, name: "shippingZones" });
  const headerLinks = useFieldArray({ control, name: "navigation.headerLinks" });
  const footerLinks = useFieldArray({ control, name: "navigation.footerLinks" });

  useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  if (isLoading) return <FullPageLoader />;

  const onSubmit = (values) => {
    toast.promise(updateMutation.mutateAsync(values), {
      loading: "Saving...",
      success: "Settings saved",
      error: (err) => err.response?.data?.message ?? "Could not save settings",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Settings</h1>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <SectionCard title="Hero Banner" description="Homepage carousel slides, shown in order.">
        <div className="flex flex-col gap-4">
          {heroBanner.fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <HeroSlideImage control={control} index={index} />
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove slide" onClick={() => heroBanner.remove(index)}>
                  <Trash2 />
                </Button>
              </div>
              <FieldGroup>
                <Field>
                  <FieldLabel>Title</FieldLabel>
                  <Input {...register(`heroBanner.${index}.title`, { required: true })} />
                </Field>
                <Field>
                  <FieldLabel>Subtitle</FieldLabel>
                  <Textarea rows={2} {...register(`heroBanner.${index}.subtitle`)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>CTA text</FieldLabel>
                    <Input {...register(`heroBanner.${index}.ctaText`)} />
                  </Field>
                  <Field>
                    <FieldLabel>CTA link</FieldLabel>
                    <Input {...register(`heroBanner.${index}.ctaLink`)} />
                  </Field>
                </div>
              </FieldGroup>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => heroBanner.append({ title: "", subtitle: "", ctaText: "", ctaLink: "" })}
          >
            <Plus /> Add Slide
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Announcement Bar">
        <FieldGroup>
          <Field>
            <FieldLabel>Text</FieldLabel>
            <Input {...register("announcementBar.text")} placeholder="e.g. Free shipping on orders over ৳5,000" />
          </Field>
          <Controller
            control={control}
            name="announcementBar.isActive"
            render={({ field }) => (
              <label className="flex w-fit items-center gap-2 text-sm text-muted-foreground">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Show announcement bar
              </label>
            )}
          />
        </FieldGroup>
      </SectionCard>

      <SectionCard title="Homepage Sections" description="Show or hide sections on the homepage, and control the hero carousel's autoplay.">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border p-4">
            <p className="mb-3 text-sm font-medium">Hero Banner</p>
            <div className="flex flex-col gap-3">
              <Controller
                control={control}
                name="homepageSections.hero.enabled"
                render={({ field }) => (
                  <label className="flex items-center justify-between gap-3 text-sm">
                    Show hero banner
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </label>
                )}
              />
              <Controller
                control={control}
                name="homepageSections.hero.autoplay"
                render={({ field }) => (
                  <label className="flex items-center justify-between gap-3 text-sm">
                    Autoplay
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </label>
                )}
              />
              <Field>
                <FieldLabel>Autoplay interval (seconds)</FieldLabel>
                <Input type="number" min={1} max={60} className="max-w-xs" {...register("homepageSections.hero.autoplayInterval")} />
              </Field>
            </div>
          </div>

          {HOMEPAGE_SECTIONS.map(({ key, label }) => (
            <SectionToggleRow key={key} control={control} name={`homepageSections.${key}.enabled`} label={label} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Why Choose Us" description="Homepage trust-signal grid.">
        <div className="flex flex-col gap-4">
          {whyChooseUs.fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex justify-end">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove item" onClick={() => whyChooseUs.remove(index)}>
                  <Trash2 />
                </Button>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>Icon</FieldLabel>
                    <Controller
                      control={control}
                      name={`whyChooseUs.${index}.icon`}
                      render={({ field: iconField }) => (
                        <Select value={iconField.value} onValueChange={iconField.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select icon" />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_NAMES.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Title</FieldLabel>
                    <Input {...register(`whyChooseUs.${index}.title`, { required: true })} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea rows={2} {...register(`whyChooseUs.${index}.description`)} />
                </Field>
              </FieldGroup>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => whyChooseUs.append({ icon: ICON_NAMES[0], title: "", description: "" })}
          >
            <Plus /> Add Item
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Collector Promise">
        <FieldGroup>
          <Field>
            <FieldLabel>Title</FieldLabel>
            <Input {...register("collectorPromise.title")} />
          </Field>
          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea rows={3} {...register("collectorPromise.description")} />
          </Field>
        </FieldGroup>
      </SectionCard>

      <SectionCard title="Testimonials" description="Only real customer testimonials — left empty until collected.">
        <div className="flex flex-col gap-4">
          {testimonials.fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex justify-end">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove testimonial" onClick={() => testimonials.remove(index)}>
                  <Trash2 />
                </Button>
              </div>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input {...register(`testimonials.${index}.name`, { required: true })} />
                  </Field>
                  <Field>
                    <FieldLabel>Rating (1-5)</FieldLabel>
                    <Input type="number" min={1} max={5} {...register(`testimonials.${index}.rating`)} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>Quote</FieldLabel>
                  <Textarea rows={2} {...register(`testimonials.${index}.quote`, { required: true })} />
                </Field>
              </FieldGroup>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => testimonials.append({ name: "", quote: "", rating: 5 })}
          >
            <Plus /> Add Testimonial
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="FAQ" description="Shown on the public FAQ page.">
        <div className="flex flex-col gap-4">
          {faqs.fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex justify-end">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove question" onClick={() => faqs.remove(index)}>
                  <Trash2 />
                </Button>
              </div>
              <FieldGroup>
                <Field>
                  <FieldLabel>Question</FieldLabel>
                  <Input {...register(`faqs.${index}.question`, { required: true })} />
                </Field>
                <Field>
                  <FieldLabel>Answer</FieldLabel>
                  <Textarea rows={2} {...register(`faqs.${index}.answer`, { required: true })} />
                </Field>
              </FieldGroup>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => faqs.append({ question: "", answer: "" })}
          >
            <Plus /> Add Question
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Social Links">
        <FieldGroup>
          <div className="grid grid-cols-3 gap-3">
            <Field>
              <FieldLabel>Facebook</FieldLabel>
              <Input {...register("socialLinks.facebook")} placeholder="https://facebook.com/..." />
            </Field>
            <Field>
              <FieldLabel>Instagram</FieldLabel>
              <Input {...register("socialLinks.instagram")} placeholder="https://instagram.com/..." />
            </Field>
            <Field>
              <FieldLabel>WhatsApp</FieldLabel>
              <Input {...register("socialLinks.whatsapp")} placeholder="https://wa.me/880..." />
            </Field>
          </div>
        </FieldGroup>
      </SectionCard>

      <SectionCard title="Contact Info">
        <FieldGroup>
          <div className="grid grid-cols-3 gap-3">
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input type="email" {...register("contactInfo.email")} />
            </Field>
            <Field>
              <FieldLabel>Phone</FieldLabel>
              <Input {...register("contactInfo.phone")} />
            </Field>
            <Field>
              <FieldLabel>Address</FieldLabel>
              <Input {...register("contactInfo.address")} />
            </Field>
          </div>
        </FieldGroup>
      </SectionCard>

      <SectionCard title="Shipping" description="Delivery zones and their flat fees, e.g. Inside Dhaka vs. Outside Dhaka.">
        <div className="flex flex-col gap-4">
          {shippingZones.fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex justify-end">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove zone" onClick={() => shippingZones.remove(index)}>
                  <Trash2 />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Zone name</FieldLabel>
                  <Input {...register(`shippingZones.${index}.name`, { required: true })} />
                </Field>
                <Field>
                  <FieldLabel>Fee (৳)</FieldLabel>
                  <Input type="number" {...register(`shippingZones.${index}.fee`, { required: true })} />
                </Field>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => shippingZones.append({ name: "", fee: 0 })}
          >
            <Plus /> Add Zone
          </Button>
          <Field>
            <FieldLabel>Free shipping threshold (৳)</FieldLabel>
            <Input type="number" className="max-w-xs" {...register("freeShippingThreshold")} />
            <p className="text-xs text-muted-foreground">Set to 0 to disable free shipping.</p>
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Payment — bKash"
        description="Customers send payment manually to this number and enter the resulting Transaction ID at checkout."
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Merchant bKash number</FieldLabel>
            <Input className="max-w-xs" {...register("bkashConfig.merchantNumber")} />
          </Field>
          <Field>
            <FieldLabel>Payment QR code</FieldLabel>
            <BkashQrImage control={control} />
          </Field>
        </FieldGroup>
      </SectionCard>

      <SectionCard title="Navigation" description="Header and footer links, and the footer tagline.">
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-3 text-sm font-medium">Header links</p>
            <div className="flex flex-col gap-4">
              {headerLinks.fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-border p-4">
                  <div className="mb-3 flex justify-end">
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove link" onClick={() => headerLinks.remove(index)}>
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel>Label</FieldLabel>
                      <Input {...register(`navigation.headerLinks.${index}.label`, { required: true })} />
                    </Field>
                    <Field>
                      <FieldLabel>URL</FieldLabel>
                      <Input {...register(`navigation.headerLinks.${index}.url`, { required: true })} placeholder="/shop" />
                    </Field>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => headerLinks.append({ label: "", url: "" })}>
                <Plus /> Add Header Link
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium">Footer links</p>
            <div className="flex flex-col gap-4">
              {footerLinks.fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-border p-4">
                  <div className="mb-3 flex justify-end">
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove link" onClick={() => footerLinks.remove(index)}>
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel>Label</FieldLabel>
                      <Input {...register(`navigation.footerLinks.${index}.label`, { required: true })} />
                    </Field>
                    <Field>
                      <FieldLabel>URL</FieldLabel>
                      <Input {...register(`navigation.footerLinks.${index}.url`, { required: true })} placeholder="/about" />
                    </Field>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => footerLinks.append({ label: "", url: "" })}>
                <Plus /> Add Footer Link
              </Button>
            </div>
          </div>

          <Field>
            <FieldLabel>Footer tagline</FieldLabel>
            <Textarea rows={2} {...register("navigation.footerText")} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="SEO Defaults">
        <FieldGroup>
          <Field>
            <FieldLabel>Default title</FieldLabel>
            <Input {...register("seoDefaults.title")} />
          </Field>
          <Field>
            <FieldLabel>Default description</FieldLabel>
            <Textarea rows={2} {...register("seoDefaults.description")} />
          </Field>
        </FieldGroup>
      </SectionCard>
    </form>
  );
}
