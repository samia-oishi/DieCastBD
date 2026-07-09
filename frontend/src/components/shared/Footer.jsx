import { Mail, Phone } from "lucide-react";

import { useSettings } from "@/features/settings/api/useSettings";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/shared/SocialIcons";
import { Container } from "@/components/shared/Container";
import logo from "@/assets/logo/logo.jpg";

export function Footer() {
  const { data: settings } = useSettings();
  const social = settings?.socialLinks ?? {};
  const contact = settings?.contactInfo ?? {};
  const hasSocial = social.facebook || social.instagram || social.whatsapp;
  const hasContact = contact.email || contact.phone;

  return (
    <footer className="border-t border-border py-12">
      <Container className="flex flex-col items-center gap-6 text-center">
        <img src={logo} alt="DiecastBD" className="h-6 w-auto" />
        <p className="max-w-sm text-sm text-muted-foreground">
          Premium diecast collectibles for serious collectors in Bangladesh.
        </p>

        {(hasSocial || hasContact) && (
          <div className="flex items-center gap-4 text-muted-foreground">
            {social.facebook && (
              <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-primary">
                <FacebookIcon className="size-4" />
              </a>
            )}
            {social.instagram && (
              <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-primary">
                <InstagramIcon className="size-4" />
              </a>
            )}
            {social.whatsapp && (
              <a href={social.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hover:text-primary">
                <WhatsAppIcon className="size-4" />
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} aria-label="Email" className="hover:text-primary">
                <Mail className="size-4" />
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} aria-label="Phone" className="hover:text-primary">
                <Phone className="size-4" />
              </a>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} DiecastBD. All rights reserved.</p>
      </Container>
    </footer>
  );
}
