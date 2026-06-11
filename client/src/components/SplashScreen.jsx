function SplashScreen() {
  return (
    <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-[3px] border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}

export default SplashScreen;
