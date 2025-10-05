import React, { useState, useEffect, useRef } from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import { Download, Code, Image, Upload, Check } from 'lucide-react';

function addPercents(a: string, b: string): string {
  const numA = parseFloat(a.replace('%', ''));
  const numB = parseFloat(b.replace('%', ''));
  const sum = numA + numB;
  return `${sum}%`;
}

class BaseGamepadItem {
  id: number
  title: string
  map: string | null = null
  prev_state: boolean = false
  export_in_code: boolean = true
  x: string
  y: string
  text_dir: "left" | "right"
  line_end_x: string
  line_end_y: string
  end_line_end_x: string
  title_text: string
  text_x: string
  title_text_y: string
  map_text_y: string

  constructor(id: number, title: string, x: string, y: string, line_dir: "left" | "right" = "left", line_end_x: string, line_end_y: string) {
    this.id = id
    this.title = title
    this.x = x
    this.y = y
    this.text_dir = line_dir
    this.line_end_x = line_end_x
    this.line_end_y = line_end_y
    this.end_line_end_x = this.text_dir === "left" ? addPercents(line_end_x, "-12%") : addPercents(line_end_x, "12%")
    this.title_text = `${this.title} ${this.getType()}`
    this.text_x = this.text_dir === "left" ? addPercents(this.end_line_end_x, "0.5%") : addPercents(this.line_end_x, "0.5%")
    this.title_text_y = addPercents(this.line_end_y, "-1%")
    this.map_text_y = addPercents(this.line_end_y, "2.25%")
  }

  getType(): string { // Edited by the child class
    return ""
  }

  mapTo(map: string): void {
    this.map = map
  }

  overlay(): JSX.Element {
    return (
      <>
        <line x1={this.x} y1={this.y} x2={this.line_end_x} y2={this.line_end_y} stroke="white" strokeWidth="1" />
        <line x1={this.line_end_x} y1={this.line_end_y} x2={this.end_line_end_x} y2={this.line_end_y} stroke="white" strokeWidth="1" />
        
        <text x={this.text_x} y={this.title_text_y} fill="white" fontSize="1.1rem" fontWeight="bold">
          {`${this.title} ${this.getType()}`}
        </text>

        <text x={this.text_x} y={this.map_text_y} fill="white" fontSize="0.8rem">
          {this.map ? this.map : "Unassigned"}
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

  constructor(button_id: number, title: string, x: string, y: string, line_direction: "left" | "right", line_end_x: string, line_end_y: string) {
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
  constructor(id: number, title: string, x: string, y: string, line_direction: "left" | "right", line_end_x: string, line_end_y: string) {
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
  buttons: GamepadButton[]
  axes: GamepadAxis[]

  constructor(name: string, buttons: GamepadButton[], axes: GamepadAxis[]) {
    this.name = name
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
  [
    new GamepadButton(0, 'A', "63%", "52.5%", "right", "75%", "57%"),
    new GamepadButton(1, 'B', "66.5%", "45.25%", "right", "75%", "49.5%"),
    new GamepadButton(2, 'X', "59.75%", "45.25%", "right", "75%", "41.5%"),
    new GamepadButton(3, 'Y', "63%", "38.5%", "right", "75%", "34%"),
    new GamepadButton(4, 'Left Bumper', "36.5%", "23.6%", "left", "30%", "25%"),
    new GamepadButton(5, 'Right Bumper', "63.5%", "24%" , "right", "70.25%", "25%"),
    new GamepadButton(6, 'Left Trigger', "37.75%", "21.65%", "left", "34%", "17%"),
    new GamepadButton(7, 'Right Trigger', "62.5%", "22.25%", "right", "66.25%", "17%"),
    new GamepadButton(8, 'Back', "45.5%", "38.25%", "right", "44%", "13%"),
    new GamepadButton(9, 'Start', "54.75%", "38.25%", "left", "58%", "21%"),
    new GamepadButton(10, 'Left Stick', "43.5%", "60.75%", "left", "30%", "88%"),
    new GamepadButton(11, 'Right Stick', "56.5%", "60.75%", "right", "70%", "88%"),
    new GamepadButton(12, 'D-Pad Up', "37.1%", "40.5%", "left", "25%", "34%"),
    new GamepadButton(13, 'D-Pad Down', "37.1%", "49.5%", "left", "25%", "57%"),
    new GamepadButton(14, 'D-Pad Left', "35%", "45%", "left", "25%", "41.5%"),
    new GamepadButton(15, 'D-Pad Right', "39%", "45%", "left", "25%", "49.5%"),
  ],
  [
    new GamepadAxis(0, 'Left Stick X', "43.5%", "60.75%", "left", "46.87%", "85%"),
    new GamepadAxis(1, 'Left Stick Y', "43.5%", "60.75%", "left", "48%", "93%"),
    new GamepadAxis(2, 'Right Stick X', "56.5%", "60.75%", "right", "53.13%", "85%"),
    new GamepadAxis(3, 'Right Stick Y', "56.5%", "60.75%", "right", "52%", "93%"),
  ],
)

enum GamepadState {
  DISCONNECTED,
  CONNECTED,
  READY
}

export default function Home() {
  const gamepadInstance = F310_GAMEPAD
  const GAMEPAD_IMAGE = "controllers/logitech_f310.png"

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
            setCurrentSelectionType(type)
            setSelectedItem(gamepadInstanceItem.title)
            setFunctionName(gamepadInstanceItem.map || "")
            setExportInCode(gamepadInstanceItem.export_in_code || true)
            setDialogOpen(true)
          }

          if (gamepadInstanceItem instanceof GamepadButton) { // If the item is a button
            setPressType(gamepadInstanceItem.press_type || "Press")
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
      {/* Overlay with title and button */}
      <div className="absolute top-3 left-0 w-full flex justify-center items-center pointer-events-none">
        <div className='flex flex-col text-center space-y-2'> 
          <h1 className="text-xl font-bold pointer-events-none">FTC Gamepad Mapper</h1>
          <h1 className="text-sm text-zinc-700 pointer-events-none">Press a button or move an axis on your gamepad to start mapping</h1>
        </div>
        <div className='absolute right-3 top-0 pointer-events-auto space-x-3'>
          <Button variant={"outline"} onClick={() => toast.info("Download button clicked")}>
            <Download className="h-6 w-6" />
          </Button>
          <Button variant={"outline"} onClick={() => toast.info("Upload button clicked")}>
            <Upload className="h-6 w-6" />
          </Button>
          <Button variant={"outline"} onClick={() => toast.info("Code button clicked")}>
            <Code className="h-6 w-6" />
          </Button>
          <Button variant={"outline"} onClick={() => toast.info("Image button clicked")}>
            <Image className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <svg className='flex w-screen h-screen absolute z-40 pointer-events-none'>
        {gamepadInstance.buttons.map((btn, i) => ( btn.overlay() ))}
        {gamepadInstance.axes.map((axis, i) => ( axis.overlay() ))}
      </svg>

      <div className="flex w-full h-full items-center justify-center">
        <img src={GAMEPAD_IMAGE} alt="Gamepad" className="w-1/2 h-auto object-cover"/>
      </div>

      {/* Alert dialog */}
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
        transition-all duration-1000 ease-in-out ${gamepadState !== GamepadState.DISCONNECTED ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <h1 className="text-2xl font-bold">Gamepad not connected</h1>
        <h1 className="text-sm font-thin">Please connect your gamepad and press a button to continue</h1>
      </div>
    </div>
  )
}