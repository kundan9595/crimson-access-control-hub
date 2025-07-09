
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shirt } from 'lucide-react';
import ClassesList from '@/components/masters/ClassesList';

const ClassesPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Shirt className="h-8 w-8 text-pink-600" />
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground">
            Manage product classes with styles, colors, and images
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Management</CardTitle>
          <CardDescription>
            Create and manage product classes that combine styles and colors with detailed information and images.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClassesList />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassesPage;
