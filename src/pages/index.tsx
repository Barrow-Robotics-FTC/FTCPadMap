import React, { useState, useEffect, useRef } from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from 'sonner'
import { Download, Code, Image as ImageIcon, Upload, Check } from 'lucide-react';

class BaseGamepadItem {
  id: number
  title: string
  map: string | null = null
  prev_state: boolean = false
  export_in_code: boolean = true
  x: number
  y: number
  text_dir: "left" | "right"
  line_end_x: number
  line_end_y: number
  end_line_end_x: number
  title_text: string
  text_x: number
  title_text_y: number
  map_text_y: number
  textAnchor: "start" | "end"

  constructor(id: number, title: string, x: number, y: number, line_dir: "left" | "right" = "left", line_end_x: number, line_end_y: number) {
    this.id = id
    this.title = title
    this.x = x
    this.y = y
    this.text_dir = line_dir
    this.line_end_x = line_end_x
    this.line_end_y = line_end_y
    this.end_line_end_x = this.text_dir === "left" ? line_end_x - 250 : line_end_x + 250
    this.title_text = `${this.title} ${this.getType()}`
    this.text_x = this.text_dir === "left" ? this.end_line_end_x + 10 : this.end_line_end_x - 10
    this.title_text_y = line_end_y - 10
    this.map_text_y = line_end_y + 20
    this.textAnchor = this.text_dir === "left" ? "start" : "end";
  }

  getType(): string { // Edited by the child class
    return ""
  }

  mapTo(map: string): void {
    this.map = map
  }

  overlay() {
    return (
      <>
        <line x1={this.x} y1={this.y} x2={this.line_end_x} y2={this.line_end_y} stroke="white" strokeWidth="2" />
        <line x1={this.line_end_x} y1={this.line_end_y} x2={this.end_line_end_x} y2={this.line_end_y} stroke="white" strokeWidth="1.5" />
        <text x={this.text_x} y={this.title_text_y} fill="white" fontSize="1.1rem" fontWeight="bold" textAnchor={this.textAnchor}>
          {`${this.title} ${this.getType()}`}
        </text>
        <text x={this.text_x} y={this.map_text_y} fill="#737373" fontSize="0.8rem" textAnchor={this.textAnchor}>
          {this.map || "Unassigned"}
        </text>
      </>
    )
  }


  itemToJSON(additional_keys: any = {}): JSON {
    return {
      id: this.id,
      title: this.title,
      map: this.map,
      export_in_code: this.export_in_code,
      ...additional_keys
    }
  }
}

class GamepadButton extends BaseGamepadItem {
  press_type: "Rise" | "Fall" | "Press" | null = null;

  constructor(button_id: number, title: string, x:number, y: number, line_direction: "left" | "right", line_end_x: number, line_end_y: number) {
    super(button_id, title, x, y, line_direction, line_end_x, line_end_y)
  }

  getType(): string {
    return "Button"
  }

  toJSON(): JSON {
    return this.itemToJSON({
      press_type: this.press_type
    })
  }
}

class GamepadAxis extends BaseGamepadItem {
  constructor(id: number, title: string, x: number, y: number, line_direction: "left" | "right", line_end_x: number, line_end_y: number) {
    super(id, title, x, y, line_direction, line_end_x, line_end_y)
  }

  getType(): string {
    return "Axis"
  }

  toJSON() {
    return this.itemToJSON()
  }
}

class Gamepad {
  name: string
  image_name: string
  image_width: number
  image_height: number
  buttons: GamepadButton[]
  axes: GamepadAxis[]

  constructor(name: string, image_name: string, image_width: number, image_height: number, buttons: GamepadButton[], axes: GamepadAxis[]) {
    this.name = name
    this.image_name = image_name
    this.image_width = image_width
    this.image_height = image_height
    this.buttons = buttons
    this.axes = axes
  }

  toJSON() {
    return {
      name: this.name,
      buttons: this.buttons.map(btn => btn.toJSON()),
      axes: this.axes.map(axis => axis.toJSON()),
    }
  }
}

const F310_GAMEPAD = new Gamepad(
  'Logitech F310',
  'logitech_f310',
  960,
  455,
  [
    new GamepadButton(0, 'A', 1235, 480, "right", 1450, 519),
    new GamepadButton(1, 'B', 1305, 410, "right", 1450, 451),
    new GamepadButton(2, 'X', 1165, 410, "right", 1450, 378),
    new GamepadButton(3, 'Y', 1235, 340, "right", 1450, 310),
    new GamepadButton(4, 'Left Bumper', 695, 188, "left", 470, 210),
    new GamepadButton(5, 'Right Bumper', 1225, 188, "right", 1450, 210),
    new GamepadButton(6, 'Left Trigger', 695, 172, "left", 470, 137),
    new GamepadButton(7, 'Right Trigger', 1225, 172, "right", 1450, 137),
    new GamepadButton(8, 'Back', 861, 335, "left", 940, 127),
    new GamepadButton(9, 'Start', 1059, 335, "right", 980, 127),
    new GamepadButton(10, 'Left Stick', 820, 560, "left", 470, 630),
    new GamepadButton(11, 'Right Stick', 1100, 560, "right", 1450, 650),
    new GamepadButton(12, 'D-Pad Up', 687, 365, "left", 470, 310),
    new GamepadButton(13, 'D-Pad Down', 687, 448, "left", 470, 530),
    new GamepadButton(14, 'D-Pad Left', 642, 405, "left", 470, 457),
    new GamepadButton(15, 'D-Pad Right', 735, 405, "left", 470, 383),
  ],
  [
    new GamepadAxis(0, 'Left Stick X', 820, 560, "left", 550, 800),
    new GamepadAxis(1, 'Left Stick Y', 820, 560, "left", 940, 850),
    new GamepadAxis(2, 'Right Stick X', 1100, 560, "right", 1370, 800),
    new GamepadAxis(3, 'Right Stick Y', 1100, 560, "right", 980, 850),
  ],
)

enum GamepadState {
  DISCONNECTED,
  CONNECTED,
  READY
}

export default function Home() {
  const gamepadInstance = F310_GAMEPAD

  const [gamepadState, setGamepadState] = useState<GamepadState>(GamepadState.DISCONNECTED)
  const gamepadStateRef = useRef(gamepadState); // Seperate ref for the loop

  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [currentSelectionType, setCurrentSelectionType] = useState<"button" | "axis">("button")
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [functionName, setFunctionName] = useState<string>("")
  const [pressType, setPressType] = useState<"Rise" | "Fall" | "Press">("Press")
  const [exportInCode, setExportInCode] = useState<boolean>(false)

  useEffect(() => {
    gamepadStateRef.current = gamepadState;
  }, [gamepadState]);

  function openDialogFor(item: GamepadButton | GamepadAxis, type: "button" | "axis") {
    setCurrentSelectionType(type)
    setSelectedItem(item.title)
    setFunctionName(item.map || "")
    setExportInCode(item.export_in_code ?? true)
    if (item instanceof GamepadButton) {
      setPressType(item.press_type || "Press")
    }
    setDialogOpen(true)
  }

  const loop = () => {
    const gamepad = navigator.getGamepads()[0]
    if (gamepadStateRef.current === GamepadState.READY && gamepad) { // If the gamepad is ready
      [...gamepad.buttons, ...gamepad.axes].forEach((item, i) => { // For each button and axis
        const type = i < gamepad.buttons.length ? "button" : "axis"
        const index = i < gamepad.buttons.length ? i : i - gamepad.buttons.length 
        const gamepadInstanceItem = type === "button" ? gamepadInstance.buttons[index] : gamepadInstance.axes[index]
        
        if (gamepadInstanceItem) { // If the item is known to the gamepad
          const condition = type === "button" ? gamepad.buttons[index].pressed : Math.abs(gamepad.axes[index]) > 0.5
          
          if (condition && !gamepadInstanceItem.prev_state) { // If the item is pressed/moved and was not previously pressed
            openDialogFor(gamepadInstanceItem, type)
          }

          gamepadInstanceItem.prev_state = condition
        }
      })
    }

    requestAnimationFrame(loop)
  }

  function handleMap() {
    if (functionName.trim() === "") {
        toast.error("Please enter a function name.")
        return
    }

    if (currentSelectionType !== "button" && currentSelectionType !== "axis") {
      toast.error("Internal error: Invalid selection type.")
      return
    }

    const searching_item = currentSelectionType === "button" ? gamepadInstance.buttons : gamepadInstance.axes
    const item = searching_item.find(item => item.title === selectedItem)
    if (!item) {
      toast.error("Internal error: Invalid selected item.")
      return
    }

    item.mapTo(functionName)
    item.export_in_code = exportInCode
    if (item instanceof GamepadButton) {
      item.press_type = pressType
    }
    
    setDialogOpen(false)
    console.log(gamepadInstance.toJSON())
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
      const jsonData = JSON.stringify(gamepadInstance.toJSON(), null, 2)
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
      <div className="absolute top-3 left-0 w-full flex justify-center items-center">
        <div className='flex flex-col text-center space-y-2'> 
          <h1 className="text-xl font-bold">FTC Gamepad Mapper</h1>
          <h1 className="text-sm text-zinc-500">Press a button or move an axis on your gamepad to start mapping</h1>
        </div>
        <div className='absolute right-3 top-0 space-x-3'>
          <Button variant={"outline"} onClick={() => exportJSON()}>
            <Download className="h-6 w-6" />
          </Button>

          <Button variant="outline" onClick={() => document.getElementById('upload-json')?.click()}>
            <Upload className="h-6 w-6" />
            <input id="upload-json" type="file" accept=".ftcpadmap" className="hidden" onChange={(e) => importJSON(e)}/>
          </Button>
          
          <Button variant={"outline"} onClick={() => toast.info("Code button clicked")}>
            <Code className="h-6 w-6" />
          </Button>
          <Button variant={"outline"} onClick={() => exportImage()}>
            <ImageIcon className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="relative flex items-center justify-center w-full h-full pointer-events-none">
        <svg id="overlay-svg" viewBox="0 0 1920 911" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', pointerEvents: 'none' }}>
          <image href={`controllers/${gamepadInstance.image_name}.png`} width="1920" height="911" />
          {gamepadInstance.buttons.map(btn => btn.overlay())}
          {gamepadInstance.axes.map(axis => axis.overlay())}
        </svg>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          {currentSelectionType === "button" ? (
            <AlertDialogHeader>
              <AlertDialogTitle>
                <strong>{selectedItem}</strong> Pressed
              </AlertDialogTitle>
              <AlertDialogDescription>
                You pressed <strong>{selectedItem}</strong>. Assign a function and choose a press type.
              </AlertDialogDescription>
            </AlertDialogHeader>
          ) : (
            <AlertDialogHeader>
              <AlertDialogTitle>
                <strong>{selectedItem}</strong> Moved
              </AlertDialogTitle>
              <AlertDialogDescription>
                You moved <strong>{selectedItem}</strong>. Assign a function.
              </AlertDialogDescription>
            </AlertDialogHeader>
          )}

          <div className="space-y-4 py-2">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="functionName">Function Name</Label>
              <Input id="functionName" placeholder="Enter function name" value={functionName} onChange={(e) => setFunctionName(e.target.value)}/>
            </div>

            {currentSelectionType === "button" && (
              <div className="flex flex-col space-y-2">
                <Label>Press Type</Label>
                <Select value={pressType} onValueChange={(val: any) => setPressType(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select press type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rise">Rise</SelectItem>
                    <SelectItem value="Fall">Fall</SelectItem>
                    <SelectItem value="Press">Press</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox checked={exportInCode} onCheckedChange={(val) => setExportInCode(val === 'indeterminate' ? true : val)} />
            <Label>Export in code</Label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleMap()}>Save</AlertDialogAction>
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