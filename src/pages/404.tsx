import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"

export default function NotFound() {
    const router = useRouter()
    return (
        <div className="flex h-screen flex-col items-center justify-center">
            <h1>FTCPadMap - 404</h1>
            <p className="text-sm text-zinc-500 mt-3">Why are we here..... on this spinning rock.....</p>
            <Button onClick={() => router.push("/")} className="mt-6">Go Home</Button>
        </div>
    )
}