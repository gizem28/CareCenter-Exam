import React from "react";
import { Table, Badge, Button } from "react-bootstrap";
import type { AvailabilityDTO } from "../../api/availabilities";

interface AvailabilityTableProps {
  availabilities: AvailabilityDTO[];
  onEdit: (availability: AvailabilityDTO) => void;
  onDelete: (id: number) => void;
  formatDate: (dateString?: string | null) => string;
  formatTime: (timeString?: string | null) => string;
  isFutureDate: (dateString?: string) => boolean;
}

const AvailabilityTable: React.FC<AvailabilityTableProps> = ({
  availabilities,
  onEdit,
  onDelete,
  formatDate,
  formatTime,
  isFutureDate,
}) => {
  return (
    <div className="table-responsive">
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {availabilities
            .sort((a, b) => {
              const dateA = a.date ? new Date(a.date).getTime() : 0;
              const dateB = b.date ? new Date(b.date).getTime() : 0;
              return dateB - dateA;
            })
            .map((availability) => (
              <tr key={availability.id}>
                <td>{formatDate(availability.date)}</td>
                <td>
                  {availability.startTime && availability.endTime
                    ? `${formatTime(availability.startTime)} - ${formatTime(
                        availability.endTime
                      )}`
                    : "All day"}
                </td>
                <td>
                  <Badge bg={availability.isBooked ? "secondary" : "success"}>
                    {availability.isBooked ? "Booked" : "Available"}
                  </Badge>
                </td>
                <td>
                  {isFutureDate(availability.date) && (
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => onEdit(availability)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => onDelete(availability.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AvailabilityTable;
