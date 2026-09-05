import { Button } from "../ui/button"

interface InterviewReportCardProps {
    title: string
    status: string
    timeAgo: string
}

export const InterviewReportCard = ({ title, status, timeAgo }: InterviewReportCardProps) => {
    return (
        <div className="flex justify-between w-full gap-2 border rounded-sm py-2.5 px-4 items-center bg-zinc-50 transition-all duration-500 ease-out hover:scale-[1.03] hover:shadow-sm ">
            <div>
                <h1 className="font-medium text-zinc-800">{title}</h1>
                <div className="flex gap-2 items-center mt-1">
                    <p className={`text-sm font-semibold ${status === "COMPLETED" ? "text-green-600" : "text-red-400"}`}>{status}</p>
                    <div className="bg-muted-foreground rounded-full p-0.5">
                    </div>
                    <p className="text-muted-foreground text-sm">{timeAgo}</p>
                </div>
            </div>
            <div>
                <Button className="bg-white cursor-pointer hover:bg-blue-50 text-black border-zinc-200 border-2">
                    View Report
                </Button>
            </div>
        </div>
    )
}