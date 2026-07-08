import { Calendar, ChartNoAxesCombined, CheckCircle, Clock } from "lucide-react"

export const QuickStats = () => {
    return (
        <div className="p-3 px-3 border border-zinc-200 rounded-md">
            <h1 className="font-bold text-[18px]"> Quick Stats </h1>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 w-full max-w-md mt-4">
                <div className="border p-2 px-4 rounded-md py-3">
                    <div className="flex justify-between items-start">
                        <div className=" space-y-2">
                            <h1 className="font-bold">12</h1>
                            <p className="text-muted-foreground text-md">Interviews</p>
                        </div>
                        <div>
                            <Calendar />
                        </div>
                    </div>
                </div>
                <div className="border p-2 px-4 rounded-md py-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <h1 className="font-bold">12</h1>
                            <p className="text-muted-foreground text-md">Completed</p>
                        </div>
                        <div className="text-green-600">
                            <CheckCircle />
                        </div>
                    </div>
                </div>
                <div className="border p-2 px-4 rounded-md py-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <h1 className="font-bold">12</h1>
                            <p className="text-muted-foreground text-md">Avg. Score</p>
                        </div>
                        <div className="text-purple-600">
                            <ChartNoAxesCombined />
                        </div>
                    </div>
                </div>
                <div className="border p-2 px-4 rounded-md py-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <h1 className="font-bold">12</h1>
                            <p className="text-muted-foreground text-md">Total Time</p>
                        </div>
                        <div className="text-orange-400">
                            <Clock />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}