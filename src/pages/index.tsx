import React, { useState, useEffect, useRef } from 'react'
import { Download, Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner'

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type LineDirection = "left" | "right"
type PressType = "On press" | "On release" | "While pressed" | null
type GamepadItem = GamepadButton | GamepadAxis

interface BaseGamepadItem {
  id: number
  title: string
  sdk_alias: string
  x: number
  y: number
  line_dir: LineDirection
  line_end_x: number
  line_end_y: number
  map?: string
  prev_state?: boolean
}

interface GamepadButton extends BaseGamepadItem {
  type: "Button"
  press_type?: PressType
}

interface GamepadAxis extends BaseGamepadItem {
  type: "Axis"
}

interface Gamepad {
  name: string
  image_name: string
  image_width: number
  image_height: number
  items: GamepadItem[]
}

const endLineX = (item: GamepadItem) : number => {
  return item.line_dir === "left" ? item.line_end_x - 250 : item.line_end_x + 250
}

const GamepadItemOverlay: React.FC<{ item: GamepadItem }> = ({ item }) => {
  const { x, y, line_dir, line_end_x, line_end_y, title, map, type } = item
  const endLineEndX = endLineX(item)
  const textX = line_dir === "left" ? endLineEndX + 10 : endLineEndX - 10
  const textAnchor = line_dir === "left" ? "start" : "end"

  return (
    <>
      <line x1={x} y1={y} x2={line_end_x} y2={line_end_y} stroke="white" strokeWidth="2" />
      <line x1={line_end_x} y1={line_end_y} x2={endLineEndX} y2={line_end_y} stroke="white" strokeWidth="1.5" />
      <text x={textX} y={line_end_y - 10} fill="white" fontSize="1.1rem" fontWeight="bold" textAnchor={textAnchor}>
        {`${title} ${type}`}
      </text>
      <text x={textX} y={line_end_y + 20} fill="#737373" fontSize="0.8rem" textAnchor={textAnchor}>
        {map || "Unassigned"}
      </text>
    </>
  )
}

function gamepadToJson(gamepad: Gamepad): any {
  return {
    name: gamepad.name,
    items: gamepad.items.map((item) => ({
      id: item.id,
      map: item.map,
      ...(item.type === "Button" && { press_type: item.press_type }),
      type: item.type
    })),
  };
}

function getGamepadItemCode(item: GamepadItem): string | undefined { // Note: undefined will never be returned
  if (item.type === "Button") {
    if (item.press_type === "On press") {
      return `gamepad1.${item.sdk_alias.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())}WasPressed()`
    } else if (item.press_type === "On release") {
      return `gamepad1.${item.sdk_alias.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())}WasReleased()`
    } else { // While pressed or not specified
      return `gamepad1.${item.sdk_alias}`
    }
  } else if (item.type === "Axis") {
    return `gamepad1.${item.sdk_alias}`
  }
}

interface GamepadDialogState {
  dialog_open: boolean
  gamepad_item?: GamepadItem
  map: string
  press_type: PressType
}
const DEFAULT_GAMEPAD_DIALOG_STATE: GamepadDialogState = { dialog_open: false, map: "", press_type: null }

enum GamepadState {
  DISCONNECTED,
  CONNECTED,
  READY
}

export const F310_GAMEPAD: Gamepad = {
  name: "Logitech F310",
  image_name: "logitech_f310",
  image_width: 960,
  image_height: 455,
  items: [
    // Buttons
    { id: 0, title: "A", sdk_alias: "a", x: 1235, y: 480, line_dir: "right", line_end_x: 1450, line_end_y: 519, type: "Button" },
    { id: 1, title: "B", sdk_alias: "b", x: 1305, y: 410, line_dir: "right", line_end_x: 1450, line_end_y: 451, type: "Button" },
    { id: 2, title: "X", sdk_alias: "x", x: 1165, y: 410, line_dir: "right", line_end_x: 1450, line_end_y: 378, type: "Button" },
    { id: 3, title: "Y", sdk_alias: "y", x: 1235, y: 340, line_dir: "right", line_end_x: 1450, line_end_y: 310, type: "Button" },
    { id: 4, title: "Left Bumper", sdk_alias: "left_bumper", x: 695, y: 188, line_dir: "left", line_end_x: 470, line_end_y: 210, type: "Button" },
    { id: 5, title: "Right Bumper", sdk_alias: "right_bumper", x: 1225, y: 188, line_dir: "right", line_end_x: 1450, line_end_y: 210, type: "Button" },
    { id: 6, title: "Left Trigger", sdk_alias: "left_trigger", x: 695, y: 172, line_dir: "left", line_end_x: 470, line_end_y: 137, type: "Button" },
    { id: 7, title: "Right Trigger", sdk_alias: "right_trigger", x: 1225, y: 172, line_dir: "right", line_end_x: 1450, line_end_y: 137, type: "Button" },
    { id: 8, title: "Back", sdk_alias: "back", x: 861, y: 335, line_dir: "left", line_end_x: 940, line_end_y: 127, type: "Button" },
    { id: 9, title: "Start", sdk_alias: "start", x: 1059, y: 335, line_dir: "right", line_end_x: 980, line_end_y: 127, type: "Button" },
    { id: 10, title: "Left Stick", sdk_alias: "left_stick_button", x: 820, y: 560, line_dir: "left", line_end_x: 470, line_end_y: 630, type: "Button" },
    { id: 11, title: "Right Stick", sdk_alias: "right_stick_button", x: 1100, y: 560, line_dir: "right", line_end_x: 1450, line_end_y: 650, type: "Button" },
    { id: 12, title: "D-Pad Up", sdk_alias: "dpad_up", x: 687, y: 365, line_dir: "left", line_end_x: 470, line_end_y: 310, type: "Button" },
    { id: 13, title: "D-Pad Down", sdk_alias: "dpad_down", x: 687, y: 448, line_dir: "left", line_end_x: 470, line_end_y: 530, type: "Button" },
    { id: 14, title: "D-Pad Left", sdk_alias: "dpad_left", x: 642, y: 405, line_dir: "left", line_end_x: 470, line_end_y: 457, type: "Button" },
    { id: 15, title: "D-Pad Right", sdk_alias: "dpad_right", x: 735, y: 405, line_dir: "left", line_end_x: 470, line_end_y: 383, type: "Button" },

    // Axes
    { id: 0, title: "Left Stick X", sdk_alias: "left_stick_x", x: 820, y: 560, line_dir: "left", line_end_x: 550, line_end_y: 800, type: "Axis" },
    { id: 1, title: "Left Stick Y", sdk_alias: "left_stick_y", x: 820, y: 560, line_dir: "left", line_end_x: 940, line_end_y: 850, type: "Axis" },
    { id: 2, title: "Right Stick X", sdk_alias: "right_stick_x", x: 1100, y: 560, line_dir: "right", line_end_x: 1370, line_end_y: 800, type: "Axis" },
    { id: 3, title: "Right Stick Y", sdk_alias: "right_stick_y", x: 1100, y: 560, line_dir: "right", line_end_x: 980, line_end_y: 850, type: "Axis" },
  ],
}

export default function Home() {
  const gamepadInstance = F310_GAMEPAD
  const [gamepadState, setGamepadState] = useState<GamepadState>(GamepadState.DISCONNECTED)
  const gamepadStateRef = useRef(gamepadState); // Seperate ref for the loop
  const [gamepadDialogState, setGamepadDialogState] = useState<GamepadDialogState>(DEFAULT_GAMEPAD_DIALOG_STATE)
  const [usageDialogOpen, setUsageDialogOpen] = useState(false)

  useEffect(() => {
    gamepadStateRef.current = gamepadState;
  }, [gamepadState]);

  function openDialogFor(item: GamepadItem) {
    var press_type = null
    if (item.type === "Button") { press_type = item.press_type ? item.press_type : null }
    
    setGamepadDialogState({
      dialog_open: true, gamepad_item: item, map: item.map ?? "", press_type: press_type
    })
  }

  function closeDialog() {
    setGamepadDialogState(DEFAULT_GAMEPAD_DIALOG_STATE)
  }

  const loop = () => {
    const gamepad = navigator.getGamepads()[0]
    if (gamepadStateRef.current === GamepadState.READY && gamepad) { // If the gamepad is ready
      gamepadInstance.items.forEach((item, i) => { // For each button and axis
        const apiGamepadItem = item.type === "Button" ? gamepad.buttons[item.id] : gamepad.axes[item.id]
        // @ts-ignore (complains about types even though there is no actual issue)
        const condition = item.type === "Button" ? apiGamepadItem.pressed : Math.abs(apiGamepadItem) > 0.5
        
        if (condition && !item.prev_state) { // If the item is in a true state and wasn't previously
          openDialogFor(item)
        }

        item.prev_state = condition
      })
    }

    requestAnimationFrame(loop)
  }

  function handleMap() {
    if (gamepadDialogState.map.trim() === "") {
        toast.error("Please enter a function name.")
        return
    }
    if (!gamepadDialogState.gamepad_item) {
        toast.error("Gamepad item not found.")
        return
    }

    gamepadDialogState.gamepad_item.map = gamepadDialogState.map
    if (gamepadDialogState.gamepad_item.type === "Button") {
      gamepadDialogState.gamepad_item.press_type = gamepadDialogState.press_type
    }
    
    closeDialog()
    console.log(gamepadToJson(gamepadInstance))
    toast.success("Successfully mapped control!")
  }

  async function exportImage() {
    try {
      // @ts-ignore
      const svgElement = document.getElementById('overlay-svg') as SVGSVGElement
      if (!svgElement) {
        toast.error('SVG overlay not found')
        return
      }

      // Find the <image> tag and convert its href to base64
      const imageElement = svgElement.querySelector('image')
      if (!imageElement) {
        toast.error('Gamepad image not found in SVG')
        return
      }

      const href = imageElement.getAttribute('href')
      if (!href) {
        toast.error('Gamepad image href missing')
        return
      }

      // Load the controller image as a base64 string
      const controllerImg = await fetch(href)
      const blob = await controllerImg.blob()
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })

      // Temporarily set the href to the base64 data
      imageElement.setAttribute('href', base64)

      // Serialize SVG with embedded PNG
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svgElement)
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)

      // Create offscreen canvas
      const img = new Image()
      img.crossOrigin = 'anonymous'
      const canvas = document.createElement('canvas')
      const width = svgElement.viewBox.baseVal.width || svgElement.clientWidth
      const height = svgElement.viewBox.baseVal.height || svgElement.clientHeight
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.fillStyle = 'hsl(240 10% 3.9%)'
          ctx.fillRect(0, 0, width, height)

          ctx.drawImage(img, 0, 0, width, height)
          URL.revokeObjectURL(svgUrl)
          resolve()
        }
        img.onerror = reject
        img.src = svgUrl
      })

      // Restore original href so your app stays functional
      imageElement.setAttribute('href', href)

      // Export PNG
      const time = new Date().toISOString().slice(0, 19).replace('T', '_')
      const link = document.createElement('a')
      link.download = `${F310_GAMEPAD.name} ${time}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      toast.success('Exported image successfully!')
    } catch (err) {
      console.error('Image export failed:', err)
      toast.error('Image export failed')
    }
  }

  function exportJSON() {
    try {
      const jsonData = JSON.stringify(gamepadToJson(gamepadInstance), null, 2)
      const blob = new Blob([jsonData], { type: 'application/json' })
      const link = document.createElement('a')
      const time = new Date().toISOString().slice(0, 19).replace('T', '_')
      link.href = URL.createObjectURL(blob)
      link.download = `${gamepadInstance.name} ${time}.ftcpadmap`
      link.click()
      toast.success('Exported JSON successfully!')
    } catch (err) {
      console.error(err)
      toast.error('JSON export failed')
    }
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        // You'll handle the parsing/updating logic
        toast.success('JSON uploaded successfully')
        console.log('Parsed JSON:', data)
      } catch (err) {
        toast.error('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  useEffect(() => {
    const onConnect = () => {
      setGamepadState(GamepadState.CONNECTED)
      toast.success("Gamepad connected!");
      setTimeout(() => setGamepadState(GamepadState.READY), 500);
      requestAnimationFrame(loop);
    };

    const onDisconnect = () => {
      toast.warning("Gamepad disconnected!");
      setGamepadState(GamepadState.DISCONNECTED);
    };

    window.addEventListener("gamepadconnected", onConnect);
    window.addEventListener("gamepaddisconnected", onDisconnect);

    return () => {
      window.removeEventListener("gamepadconnected", onConnect);
      window.removeEventListener("gamepaddisconnected", onDisconnect);
    };
  }, []);

  return (
    <div className="relative flex w-screen h-screen">
      <div className="absolute top-3 left-0 w-full flex justify-center items-center z-50">
        <div className='flex flex-col text-center space-y-2'> 
          <h1 className="text-xl font-bold">FTC Gamepad Mapper</h1>
          <Button className="text-sm text-zinc-500 max-w-[90vw] h-8" variant="ghost" onClick={() => setUsageDialogOpen(true)}>Click here for usage instructions</Button>
        </div>

        <div className='absolute right-3 top-0 space-x-3'>
          <Button variant={"outline"} onClick={() => exportJSON()}>
            <Download className="h-6 w-6" />
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('upload-json')?.click()}>
            <Upload className="h-6 w-6" />
            <input id="upload-json" type="file" accept=".ftcpadmap" className="hidden" onChange={(e) => importJSON(e)}/>
          </Button>
          <Button variant={"outline"} onClick={() => exportImage()}>
            <ImageIcon className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="relative flex items-center justify-center w-full h-full">
        <svg id="overlay-svg" viewBox="0 0 1920 911" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', pointerEvents: 'none' }}>
          <image href={`controllers/${gamepadInstance.image_name}.png`} width="1920" height="911" />
          {gamepadInstance.items.map(item => GamepadItemOverlay({ item }))}
        </svg>

        <div className="absolute top-0 left-0 w-full h-full">
          {gamepadInstance.items.map((item, i) => (
            <Tooltip key={`tooltip_${i}`}>
              <TooltipTrigger asChild>
                <div
                  className="absolute w-8 h-8 bg-transparent cursor-pointer opacity-75 rounded-full hover:bg-zinc-600/70 transition-colors duration-200"
                  style={{ left: `${endLineX(item) - 16}px`, top: `${item.line_end_y - 16}px` }}
                  onClick={() => openDialogFor(item)}
                />
              </TooltipTrigger>
              <TooltipContent className="p-2 bg-zinc-900 border border-zinc-800 text-left space-y-2 max-w-sm">
                <div>
                  <h1 className="font-semibold text-base text-white">
                    {item.title} {item.type}
                  </h1>
                  <p className="text-zinc-500 text-sm"><strong className='text-zinc-400'>Map:</strong> {item.map || 'Unassigned'}</p>

                  {item.type === "Button" && (
                    <p className="text-zinc-500 text-sm"><strong className='text-zinc-400'>Press Type:</strong> {item.press_type ?? "While pressed"}</p>
                  )}
                </div>

                <div className="pt-1 border-t border-zinc-800 space-y-1">
                  <strong className="text-xs text-zinc-400">Access in code:</strong>
                  <code className="block text-xs bg-zinc-800/70 border border-zinc-700 text-zinc-300 rounded-md p-1 font-mono">
                    {getGamepadItemCode(item)}
                  </code>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      <AlertDialog open={gamepadDialogState.dialog_open} onOpenChange={closeDialog}>
        <AlertDialogContent>
          {gamepadDialogState.gamepad_item && (
            <>
              {gamepadDialogState.gamepad_item.type === "Button" ? (
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    <strong>{gamepadDialogState.gamepad_item.title}</strong> Pressed
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    You pressed <strong>{gamepadDialogState.gamepad_item.title}</strong>. Assign a function and choose a press type.
                  </AlertDialogDescription>
                </AlertDialogHeader>
              ) : (
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    <strong>{gamepadDialogState.gamepad_item.title}</strong> Moved
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    You moved <strong>{gamepadDialogState.gamepad_item.title}</strong>. Assign a function.
                  </AlertDialogDescription>
                </AlertDialogHeader>
              )}

              <div className="space-y-4 py-2">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="functionName">Function Name</Label>
                  <Input
                    id="functionName"
                    placeholder="Enter function name"
                    value={gamepadDialogState.map}
                    onChange={(e) => setGamepadDialogState({ ...gamepadDialogState, map: e.target.value })}
                  />
                </div>

                {gamepadDialogState.gamepad_item.type === "Button" && (
                  <div className="flex flex-col space-y-2">
                    <Label>Press Type</Label>
                    <Select value={gamepadDialogState.press_type ?? "While pressed"} onValueChange={(val: any) => setGamepadDialogState({ ...gamepadDialogState, press_type: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select press type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="On release">On release</SelectItem>
                        <SelectItem value="On press">On press</SelectItem>
                        <SelectItem value="While pressed">While pressed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleMap()}>Save</AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={usageDialogOpen} onOpenChange={setUsageDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              FTCPadMap Usage
            </AlertDialogTitle>
            <AlertDialogDescription>
              Usage instructions for FTCPadMap
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <Accordion type="single" collapsible>
            <AccordionItem value="What is FTCPadMap?">
              <AccordionTrigger>What is FTCPadMap?</AccordionTrigger>
              <AccordionContent>
                FTCPadMap is a tool for FTC teams to easily create gamepad map graphics.
                You can choose to use a gamepad and press buttons on it to assign functions or do it manually through the UI.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="How to use (controller)">
              <AccordionTrigger>How to use (controller)</AccordionTrigger>
              <AccordionContent>
                If you have a gamepad connected, you can simply press a button or move an axis to assign a function.
                Once you perform an action, a dialog will open where you can type a function name and choose a press type (for buttons).
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="How to use (manual)">
              <AccordionTrigger>How to use (manual)</AccordionTrigger>
              <AccordionContent>
                If you have a aren't using a gamepad, you can press at the end of any line that cooresponds with a gamepad button or axis.
                Once you press one, a dialog will open where you can type a function name and choose a press type (for buttons).
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="Tooltips">
              <AccordionTrigger>Tooltips</AccordionTrigger>
              <AccordionContent>
                For all information about a gamepad button or axis, hover over the end of the line that cooresponds with it, a tooltip will appear.
                The tooltip contains more information about the button including a code snippet to access the value of the button/axis in your code.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="Saving and loading">
              <AccordionTrigger>Saving and loading</AccordionTrigger>
              <AccordionContent>
                If you would like to save your gamepad map to edit it in the future, or axxess the tooltips at a later date,
                you can use the download and upload buttons in the top right corner of the UI.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="Saving a graphical image">
              <AccordionTrigger>Saving a graphical image</AccordionTrigger>
              <AccordionContent>
                If you would like to save an image of your map, you can use the image button at the top right corner of the UI.
                This will download a PNG image to your device containing your map.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="Need help?">
              <AccordionTrigger>Need help?</AccordionTrigger>
              <AccordionContent>
                If you have any questions, comments, concerns, or suggestions, please create a GitHub issue
                <a> </a><a href="https://github.com/Barrow-Robotics-FTC/FTCPadMap/issues" target="_blank" rel="noopener noreferrer" className="text-white font-bold underline">here</a>.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <p className='text-sm text-center text-zinc-500'>© 2025 Barrow Robotics Program. Licensed under the GNU GPLv3.</p>
          <AlertDialogFooter>
            <AlertDialogCancel>Ok</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

     <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center space-y-2 backdrop-blur-lg grayscale bg-black/30 
        transition-all duration-1000 ease-in-out ${gamepadState !== GamepadState.DISCONNECTED ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"}`}>
        <h1 className="text-2xl font-bold">Gamepad not connected</h1>
        <h1 className="text-sm font-thin">Please connect your gamepad and press a button to continue</h1>
      </div>
    </div>
  )
}