import type React from "react"
import "@mantine/core/styles.css"
import "./globals.css"
import { MantineProvider, ColorSchemeScript } from "@mantine/core"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: "Rebane's Discord Colored Text Generator",
  description: "Generate colored text for Discord using ANSI codes",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider
          theme={{
            colorScheme: "dark",
            primaryColor: "blue",
          }}
        >
          {children}
          <Analytics />
        </MantineProvider>
      </body>
    </html>
  )
}



import './globals.css'