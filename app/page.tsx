"use client"

import { useState, useRef, useEffect } from "react"
import { Button, Container, Title, Text, Group, Tooltip, Box, Paper, Stack, Anchor } from "@mantine/core"
import { useClipboard } from "@mantine/hooks"

// ANSI color classes
const ansiClasses = {
  // Styles
  "1": "font-bold",
  "4": "underline",
  // Foreground colors
  "30": "text-[#4f545c]",
  "31": "text-[#dc322f]",
  "32": "text-[#859900]",
  "33": "text-[#b58900]",
  "34": "text-[#268bd2]",
  "35": "text-[#d33682]",
  "36": "text-[#2aa198]",
  "37": "text-[#ffffff]",
  // Background colors
  "40": "bg-[#002b36]",
  "41": "bg-[#cb4b16]",
  "42": "bg-[#586e75]",
  "43": "bg-[#657b83]",
  "44": "bg-[#839496]",
  "45": "bg-[#6c71c4]",
  "46": "bg-[#93a1a1]",
  "47": "bg-[#fdf6e3]",
}

// Color tooltips
const tooltipTexts: Record<string, string> = {
  // FG
  "30": "Dark Gray (33%)",
  "31": "Red",
  "32": "Yellowish Green",
  "33": "Gold",
  "34": "Light Blue",
  "35": "Pink",
  "36": "Teal",
  "37": "White",
  // BG
  "40": "Blueish Black",
  "41": "Rust Brown",
  "42": "Gray (40%)",
  "43": "Gray (45%)",
  "44": "Light Gray (55%)",
  "45": "Blurple",
  "46": "Light Gray (60%)",
  "47": "Cream White",
}

export default function DiscordTextGenerator() {
  const textareaRef = useRef<HTMLDivElement>(null)
  const clipboard = useClipboard()
  const [copyMessage, setCopyMessage] = useState("Copy text as Discord formatted")
  const [copyCount, setCopyCount] = useState(0)

  // Replace the applyStyle function with this improved version that preserves existing styles
  const applyStyle = (ansiCode: string) => {
    if (!textareaRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    // Reset all formatting
    if (ansiCode === "0") {
      if (textareaRef.current) {
        textareaRef.current.innerText = textareaRef.current.innerText
      }
      return
    }

    const range = selection.getRangeAt(0)
    const selectedText = selection.toString()

    if (selectedText) {
      // Check if selection is inside a span with existing ANSI classes
      let existingClasses: string[] = []
      let parentNode = range.commonAncestorContainer

      // If the selection is just text, get its parent
      if (parentNode.nodeType === Node.TEXT_NODE) {
        parentNode = parentNode.parentNode
      }

      // Collect existing ANSI classes if any
      if (parentNode instanceof HTMLElement && parentNode.className) {
        const classNames = parentNode.className.split(" ")
        existingClasses = classNames.filter((cls) => cls.startsWith("ansi-"))
      }

      // Create new span with the selected text
      const span = document.createElement("span")
      span.innerText = selectedText

      // Determine what type of style we're applying
      const isStyle = ansiCode === "1" || ansiCode === "4"
      const isFgColor = Number.parseInt(ansiCode) >= 30 && Number.parseInt(ansiCode) < 40
      const isBgColor = Number.parseInt(ansiCode) >= 40

      // Filter out existing classes that would conflict with the new one
      const preservedClasses = existingClasses.filter((cls) => {
        const code = cls.split("-")[1]
        if (isStyle) return !(code === "1" || code === "4")
        if (isFgColor) return !(Number.parseInt(code) >= 30 && Number.parseInt(code) < 40)
        if (isBgColor) return !(Number.parseInt(code) >= 40)
        return true
      })

      // Add the new class
      const newClass = `ansi-${ansiCode}`
      const allClasses = [...preservedClasses, newClass]

      // Set all classes and corresponding Tailwind classes
      span.className = allClasses
        .map((cls) => {
          const code = cls.split("-")[1]
          return `${cls} ${ansiClasses[code] || ""}`
        })
        .join(" ")

      range.deleteContents()
      range.insertNode(span)

      // Keep the selection on the newly created span
      range.selectNodeContents(span)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }

  // Function to convert DOM nodes to ANSI escape sequences
  const nodesToANSI = (
    nodes: NodeListOf<ChildNode> | Array<ChildNode>,
    states: Array<{ fg: number; bg: number; st: number }> = [{ fg: 2, bg: 2, st: 2 }],
  ): string => {
    let text = ""

    for (const node of Array.from(nodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent
        continue
      }

      if (node.nodeName === "BR") {
        text += "\n"
        continue
      }

      if (node instanceof HTMLElement) {
        const className = node.className
        if (className && className.includes("ansi-")) {
          const ansiCode = +className.split("ansi-")[1].split(" ")[0]
          const newState = { ...states[states.length - 1] }

          if (ansiCode < 30) newState.st = ansiCode
          if (ansiCode >= 30 && ansiCode < 40) newState.fg = ansiCode
          if (ansiCode >= 40) newState.bg = ansiCode

          states.push(newState)
          text += `\x1b[${newState.st};${ansiCode >= 40 ? newState.bg : newState.fg}m`
          text += nodesToANSI(node.childNodes, states)
          states.pop()
          text += `\x1b[0m`

          if (states[states.length - 1].fg !== 2) {
            text += `\x1b[${states[states.length - 1].st};${states[states.length - 1].fg}m`
          }
          if (states[states.length - 1].bg !== 2) {
            text += `\x1b[${states[states.length - 1].st};${states[states.length - 1].bg}m`
          }
        } else {
          text += nodesToANSI(node.childNodes, states)
        }
      }
    }

    return text
  }

  // Handle copy button click
  const handleCopy = () => {
    if (!textareaRef.current) return

    const toCopy = "```ansi\n" + nodesToANSI(textareaRef.current.childNodes) + "\n```"
    clipboard.copy(toCopy)

    const funnyCopyMessages = [
      "Copied!",
      "Double Copy!",
      "Triple Copy!",
      "Dominating!!",
      "Rampage!!",
      "Mega Copy!!",
      "Unstoppable!!",
      "Wicked Sick!!",
      "Monster Copy!!!",
      "GODLIKE!!!",
      "BEYOND GODLIKE!!!!",
    ]

    setCopyMessage(funnyCopyMessages[Math.min(copyCount, funnyCopyMessages.length - 1)])
    setCopyCount((prev) => Math.min(10, prev + 1))

    // Reset copy message after 2 seconds
    setTimeout(() => {
      setCopyMessage("Copy text as Discord formatted")
      if (copyCount >= 10) setCopyCount(0)
    }, 2000)
  }

  // Handle keyboard events for line breaks
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && document.activeElement === textareaRef.current) {
        document.execCommand("insertLineBreak")
        event.preventDefault()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  // Handle paste to clean HTML
  useEffect(() => {
    const handleInput = () => {
      if (!textareaRef.current) return

      const content = textareaRef.current.innerHTML
      const base = content.replace(/<(\/?(br|span|span class="ansi-[0-9]*"))>/g, "[$1]")

      if (base.includes("<") || base.includes(">")) {
        textareaRef.current.innerHTML = base
          .replace(/<.*?>/g, "")
          .replace(/[<>]/g, "")
          .replace(/\[(\/?(br|span|span class="ansi-[0-9]*"))\]/g, "<$1>")
      }
    }

    const textarea = textareaRef.current
    if (textarea) {
      textarea.addEventListener("input", handleInput)
      return () => {
        textarea.removeEventListener("input", handleInput)
      }
    }
  }, [])

  return (
    <Box className="min-h-screen bg-[#36393F] text-white">
      <Container size="md" className="py-8">
        <Title order={1} className="text-center mb-6">
          Rebane&apos;s Discord <span className="text-[#5865F2]">Colored</span> Text Generator
        </Title>

         

        <Title order={2} className="text-center mb-4">
          Create your text
        </Title>

        <Stack align="center" spacing="md">
          <Group spacing="xs">
            <Button variant="filled" className="bg-[#4f545c] hover:bg-[#5d6269]" onClick={() => applyStyle("0")}>
              Reset All
            </Button>
            <Button
              variant="filled"
              className="bg-[#4f545c] hover:bg-[#5d6269] font-bold"
              onClick={() => applyStyle("1")}
            >
              Bold
            </Button>
            <Button
              variant="filled"
              className="bg-[#4f545c] hover:bg-[#5d6269] underline"
              onClick={() => applyStyle("4")}
            >
              Line
            </Button>
          </Group>

          <Group spacing="xs" align="center">
            <Text weight={700} className="mr-2">
              FG
            </Text>
            {[30, 31, 32, 33, 34, 35, 36, 37].map((code) => (
              <Tooltip key={code} label={tooltipTexts[code.toString()]} position="top">
                <Button
                  variant="filled"
                  className={`w-8 h-8 p-0 ${ansiClasses[code.toString()]}`}
                  onClick={() => applyStyle(code.toString())}
                />
              </Tooltip>
            ))}
          </Group>

          <Group spacing="xs" align="center">
            <Text weight={700} className="mr-2">
              BG
            </Text>
            {[40, 41, 42, 43, 44, 45, 46, 47].map((code) => (
              <Tooltip key={code} label={tooltipTexts[code.toString()]} position="top">
                <Button
                  variant="filled"
                  className={`w-8 h-8 p-0 ${ansiClasses[code.toString()]}`}
                  onClick={() => applyStyle(code.toString())}
                />
              </Tooltip>
            ))}
          </Group>

          <div
            ref={textareaRef}
            contentEditable
            className="w-full max-w-[600px] h-[200px] bg-[#2F3136] text-[#B9BBBE] border border-[#202225] rounded p-2 text-left font-mono text-sm leading-[1.125rem] whitespace-pre-wrap resize overflow-auto"
            suppressContentEditableWarning
          >
            Welcome to <span className="ansi-33 text-[#b58900]">Rebane</span>&apos;s{" "}
            <span className="ansi-45 bg-[#6c71c4]">
              <span className="ansi-37 text-[#ffffff]">Discord</span>
            </span>{" "}
            <span className="ansi-31 text-[#dc322f]">C</span>
            <span className="ansi-32 text-[#859900]">o</span>
            <span className="ansi-33 text-[#b58900]">l</span>
            <span className="ansi-34 text-[#268bd2]">o</span>
            <span className="ansi-35 text-[#d33682]">r</span>
            <span className="ansi-36 text-[#2aa198]">e</span>
            <span className="ansi-37 text-[#ffffff]">d</span> Text Generator!
          </div>

          <Button
            variant="filled"
            className={`bg-${copyCount >= 9 ? "[#ED4245]" : "[#4f545c]"} hover:bg-${copyCount >= 9 ? "[#f23f43]" : "[#5d6269]"} mt-4`}
            onClick={handleCopy}
          >
            {copyMessage}
          </Button>
        </Stack>

        <Text size="xs" className="text-center mt-8">
          This is an unofficial tool, it is not made or endorsed by Discord.
        </Text>
      </Container>
    </Box>
  )
}

