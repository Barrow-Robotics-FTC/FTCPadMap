import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import { Download } from 'lucide-react';

class GamepadButton {
  button_id: number
  title: string

  map: string | null = null;
  press_type: "Rising Edge" | "Falling Edge" | "Press" | null = null;
  prev_pressed: boolean = false;

  constructor(button_id: number, title: string) {
    this.button_id = button_id
    this.title = title
  }

  toJSON() {
    return {
      button_id: this.button_id,
      title: this.title,
      map: this.map,
      press_type: this.press_type,
    }
  }
}

class GamepadAxis {
  axis_id: number
  title: string

  map: string | null = null;
  prev_moved: boolean = false

  constructor(axis_id: number, title: string) {
    this.axis_id = axis_id
    this.title = title
  }

  toJSON() {
    return {
      axis_id: this.axis_id,
      title: this.title,
      map: this.map,
    }
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
    new GamepadButton(0, 'A'),
    new GamepadButton(1, 'B'),
    new GamepadButton(2, 'X'),
    new GamepadButton(3, 'Y'),
    new GamepadButton(4, 'Left Bumper'),
    new GamepadButton(5, 'Right bumper'),
    new GamepadButton(6, 'Left Trigger'),
    new GamepadButton(7, 'Right Trigger'),
    new GamepadButton(8, 'Back'),
    new GamepadButton(9, 'Start'),
    new GamepadButton(10, 'Left Stick Button'),
    new GamepadButton(11, 'Right Stick Button'),
    new GamepadButton(12, 'D-Pad Up'),
    new GamepadButton(13, 'D-Pad Down'),
    new GamepadButton(14, 'D-Pad Left'),
    new GamepadButton(15, 'D-Pad Right'),
  ],
  [
    new GamepadAxis(0, 'Left Stick X'),
    new GamepadAxis(1, 'Left Stick Y'),
    new GamepadAxis(2, 'Right Stick X'),
    new GamepadAxis(3, 'Right Stick Y'),
  ],
)

export default function Home() {
  const gamepad_instance = F310_GAMEPAD
  const GAMEPAD_IMAGE = "controllers/logitech_f310.png"

  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentSelectionType, setCurrentSelectionType] = useState<"button" | "axis">("button")
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [functionName, setFunctionName] = useState("")
  const [pressType, setPressType] = useState<"Rising Edge" | "Falling Edge" | "Press">("Press")

  const loop = () => {
    const gamepad = navigator.getGamepads()[0]
    if (gamepad) { // If the gamepad is connected
      gamepad.buttons.forEach((btn, i) => { // For each button
        if (gamepad_instance.buttons[i]) { // If the buttton is known to the gamepad
          const gamepad_instance_button = gamepad_instance.buttons[i]
          if (btn.pressed && ! gamepad_instance_button.prev_pressed) { // If the button is pressed and was not previously pressed
            setCurrentSelectionType("button")
            setSelectedItem(gamepad_instance_button.title)
            setFunctionName(gamepad_instance_button.map || "")
            setPressType(gamepad_instance_button.press_type || "Press")
            setDialogOpen(true)
          }
          gamepad_instance_button.prev_pressed = btn.pressed
        }
      })

      gamepad.axes.forEach((axis, i) => { // For each axis
        if (gamepad_instance.axes[i]) { // If the axis is known to the gamepad
          const gamepad_instance_axis = gamepad_instance.axes[i]
          if (Math.abs(axis) > 0.5 && !gamepad_instance_axis.prev_moved) { // If the axis is moved
            setCurrentSelectionType("axis")
            setSelectedItem(gamepad_instance_axis.title)
            setFunctionName(gamepad_instance_axis.map || "")
            setDialogOpen(true)
          }
          gamepad_instance_axis.prev_moved = Math.abs(axis) > 0.5
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

    if (currentSelectionType === "button") {
      const button = gamepad_instance.buttons.find(btn => btn.title === selectedItem)
      if (button) {
        button.map = functionName
        button.press_type = pressType
      }
    } else if (currentSelectionType === "axis") {
      const axis = gamepad_instance.axes.find(axis => axis.title === selectedItem)
      if (axis) {
        axis.map = functionName
      }
    } else {
      toast.error("Internal error: Invalid selection type.")
      return;
    }
    
    setDialogOpen(false)
    toast.success("Successfully mapped control!")
  }

  useEffect(() => {
    window.addEventListener('gamepadconnected', () => {
      console.log('Gamepad connected')
      toast.success('Gamepad connected!')
      requestAnimationFrame(loop)
    })
    return () => {
        toast.warning('Gamepad disconnected!')
        window.removeEventListener('gamepadconnected', loop)
    }
  }, [])

  return (
    <div className="relative flex w-screen h-screen">
      {/* Overlay with title and button */}
      <div className="absolute top-3 left-0 w-full flex justify-center items-center pointer-events-none">
        <div className='flex flex-col text-center space-y-2'> 
          <h1 className="text-xl font-bold pointer-events-none">FTC Gamepad Mapper</h1>
          <h1 className="text-sm text-zinc-700 pointer-events-none">Press a button or move an axis on your gamepad to start mapping</h1>
        </div>
        <Button variant={"outline"} onClick={() => toast.info("Top right button clicked")} className="absolute right-2 top-0 pointer-events-auto">
          <Download className="h-6 w-6" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex w-full h-full items-center justify-center">
        <img
          src={GAMEPAD_IMAGE}
          alt="Gamepad"
          className="w-1/2 h-auto object-cover"
        />
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
                You pressed <strong>{selectedItem}</strong>. Assign a function and
                choose an edge type.
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
              <Input
                id="functionName"
                placeholder="Enter function name"
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
              />
            </div>

            {currentSelectionType === "button" && (
              <div className="flex flex-col space-y-2">
                <Label>Press Type</Label>
                <Select
                  value={pressType}
                  onValueChange={(val: any) => setPressType(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select press type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rising Edge">Rising Edge</SelectItem>
                    <SelectItem value="Falling Edge">Falling Edge</SelectItem>
                    <SelectItem value="Press">Press</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleMap()}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}