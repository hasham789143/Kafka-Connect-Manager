"use client";

import { Connector, ConnectorStatus, Task } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  MoreHorizontal,
  PauseCircle,
  Play,
  RefreshCcw,
  Trash2,
  XCircle,
  FlaskConical,
  CircleHelp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const statusIcons: Record<ConnectorStatus, React.ReactNode> = {
  RUNNING: <CheckCircle2 className="text-green-500" />,
  PAUSED: <PauseCircle className="text-yellow-500" />,
  FAILED: <XCircle className="text-red-500" />,
  UNASSIGNED: <CircleHelp className="text-gray-500" />,
};

const statusBadgeVariants: Record<ConnectorStatus, "default" | "secondary" | "destructive" | "outline"> = {
    RUNNING: 'default',
    PAUSED: 'secondary',
    FAILED: 'destructive',
    UNASSIGNED: 'outline',
};

const TaskStatusIndicator = ({ task }: { task: Task }) => {
  const statusIcon = statusIcons[task.state];
  let tooltipContent = `Task ${task.id} on ${task.worker_id}: ${task.state}`;
  if (task.state === 'FAILED' && task.trace) {
    tooltipContent += `\n\nTrace:\n${task.trace}`;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-pointer">{statusIcon}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-md whitespace-pre-wrap">
        <p>{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
};


type ConnectorTableProps = {
  connectors: Connector[];
  onAnalyzeError: (connector: Connector) => void;
};

export function ConnectorTable({ connectors, onAnalyzeError }: ConnectorTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Topics</TableHead>
              <TableHead className="hidden md:table-cell">Plugin</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connectors.length > 0 ? (
              connectors.map((connector) => (
                <TableRow key={connector.id}>
                  <TableCell>
                    <Badge variant={statusBadgeVariants[connector.status]} className="gap-1.5 pl-1.5">
                      {statusIcons[connector.status]}
                      {connector.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{connector.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        {connector.type === 'source' ? <ArrowUpFromLine className="size-4" /> : <ArrowDownToLine className="size-4" />}
                        <span className="capitalize">{connector.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {connector.tasks.map(task => <TaskStatusIndicator key={task.id} task={task} />)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {connector.topics.map(topic => <Badge key={topic} variant="outline" className="mr-1 mb-1">{topic}</Badge>)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate">{connector.plugin}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Play /> Resume
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <PauseCircle /> Pause
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCcw /> Restart
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {connector.status === 'FAILED' && (
                          <>
                            <DropdownMenuItem onClick={() => onAnalyzeError(connector)}>
                              <FlaskConical /> Analyze Error
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No connectors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
