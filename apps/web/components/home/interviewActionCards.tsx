import { CircleChevronRight } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardDescription, CardTitle } from "../ui/card"

interface interviewActionCardsProp {
    title: string,
    description: string,
    buttonDescription: string
};

export const InterviewActionCards = ({ title, description, buttonDescription }: interviewActionCardsProp) => {
    return (
        <div>
            <Card className="p-4 px-6 bg-zinc-50 rounded-sm hover:bg-zinc-100 transition-all duration-500 ease-out hover:px-7 hover:shadow-sm">
                <CardTitle className="pt-3 text-blue-600 font-semibold text-xl">{title}</CardTitle>
                <CardDescription className="font-medium">{description}</CardDescription>
                <Button className="bg-white hover:bg-blue-50 hover:border-zinc-200 cursor-pointer border-2 border-zinc-100 font-semibold  text-blue-500 flex justify-start items-center gap-2 rounded-lg w-fit mt-2 p-5 px-8">
                    <p>
                        {buttonDescription}
                    </p>
                    <CircleChevronRight fill="blue" className="text-white size-6" />
                </Button>
            </Card>
        </div>
    )
};