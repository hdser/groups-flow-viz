const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="spinner"></div>
  </div>
);

const Groups = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner />
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading groups...</p>
    </div>
  </div>
);

const Balances = () => (
  <div className="card h-[600px] flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner />
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Fetching treasury balances...
      </p>
    </div>
  </div>
);

const Flows = ({ progress }) => (
  <div className="card h-[600px] flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner />
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Calculating flows... {Math.round(progress * 100)}%
      </p>
      <div className="mt-4 w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-circles-purple h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  </div>
);

export default {
  Groups,
  Balances,
  Flows
};