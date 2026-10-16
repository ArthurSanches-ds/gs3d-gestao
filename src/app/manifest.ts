import type { MetadataRoute } from "next";

// Permite instalar o sistema na tela inicial do celular e do PC, abrindo como app
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GS3D Gestão",
    short_name: "GS3D",
    description: "Gestão de custos, preços, estoque e lucro da GS3D Studio",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1a20",
    theme_color: "#0e1a20",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
