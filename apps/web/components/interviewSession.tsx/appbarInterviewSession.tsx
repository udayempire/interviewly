import { Clock } from "lucide-react"
import { Button } from "../ui/button"

export const AppbarInterviewSession = () => {
    return (
        <div className="flex justify-between p-2 px-6 border-b items-center">
            <div className="flex">
                {/* place for logo of interviewlly */}
                <h1 className="font-semibold">Interviewlyy</h1>
            </div>
            <div className="flex gap-4 ml-24 font-medium">
                <h1>Frontend Developer Interview</h1>
            </div>
            <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                    <span>
                        <Clock size={20} />
                    </span>
                    <p className="font-medium">00:18:42</p>
                </div>
                <div>
                    <Button variant="destructive">Leave Interview</Button>
                </div>
            </div>


        </div>
    )
}