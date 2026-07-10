// Deliberately seeded with no body content and isPublished: false — inventing
// Terms/Privacy/Refund/Shipping-Policy legal text would be actively harmful if
// it ever shipped unedited (same "no fabricated content" rule as testimonials
// and social links elsewhere in this codebase, just higher-stakes here since
// this is legal copy, not marketing copy). An admin writes and publishes the
// real text via Admin -> Pages once it exists.
export const pagesSeed = [
  { title: "Terms & Conditions", content: "", isPublished: false },
  { title: "Privacy Policy", content: "", isPublished: false },
  { title: "Refund Policy", content: "", isPublished: false },
  { title: "Shipping Policy", content: "", isPublished: false },
];
