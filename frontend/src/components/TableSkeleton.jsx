import React from "react";
import { Skeleton } from "./ui/skeleton";

const TableSkeleton = () => {
  const rows = Array.from({ length: 5 }); // Number of rows in the skeleton

  return (
    <div className="w-full p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th><Skeleton className="h-4 w-20" /></th>
              <th><Skeleton className="h-4 w-32" /></th>
              <th><Skeleton className="h-4 w-24" /></th>
              <th><Skeleton className="h-4 w-28" /></th>
              <th><Skeleton className="h-4 w-20" /></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((_, index) => (
              <tr key={index} className="mb-2">
                <td><Skeleton className="h-4 w-full" /></td>
                <td><Skeleton className="h-4 w-full" /></td>
                <td><Skeleton className="h-4 w-full" /></td>
                <td><Skeleton className="h-4 w-full" /></td>
                <td><Skeleton className="h-4 w-full" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;
