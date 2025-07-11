
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

type CompleteStepProps = {
  type: string;
  onClose: () => void;
};

const CompleteStep: React.FC<CompleteStepProps> = ({ type, onClose }) => {
  return (
    <div className="text-center space-y-4">
      <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
      <div>
        <h3 className="text-lg font-semibold">Import Completed Successfully!</h3>
        <p className="text-muted-foreground">
          Your {type} have been imported and are now available.
        </p>
      </div>
      <Button onClick={onClose}>
        Close
      </Button>
    </div>
  );
};

export default CompleteStep;
