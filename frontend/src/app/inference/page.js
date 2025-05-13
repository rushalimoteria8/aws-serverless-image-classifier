'use client';

import { useState, useEffect } from 'react';
import { BounceLoader } from 'react-spinners';

const categories = [
  'Bread', 'Dairy product', 'Dessert', 'Egg', 'Fried food', 'Meat',
  'Noodles-Pasta', 'Rice', 'Seafood', 'Soup', 'Vegetable-Fruit'
];

const labelToQuery = {
  'Bread': 'whole wheat bread',
  'Dairy product': 'cheddar cheese',
  'Dessert': 'chocolate cake',
  'Egg': 'egg',
  'Fried food': 'fried chicken',
  'Meat': 'grilled chicken breast',
  'Noodles-Pasta': 'cooked spaghetti',
  'Rice': 'white rice cooked',
  'Seafood': 'grilled salmon',
  'Soup': 'tomato soup',
  'Vegetable-Fruit': 'mixed vegetables cooked',
};

const importantNutrients = [
  'Energy',
  'Protein',
  'Total lipid (fat)',
  'Carbohydrate, by difference',
  'Total Sugars',
  'Fiber, total dietary',
  'Sodium, Na'
];

export default function InferencePage() {
  const [file, setFile] = useState(null);
  const [imageId, setImageId] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [nutrients, setNutrients] = useState([]);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setImageId(Date.now().toString());
    setStatus('');
    setResult(null);
    setError(null);
    setShowPopup(false);
    setNutrients([]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64String = reader.result.split(',')[1];

      const response = await fetch('https://lvxlr34bfb.execute-api.us-east-2.amazonaws.com/dev-stage/image-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: imageId, image_data: base64String })
      });

      if (response.ok) {
        setStatus('Uploaded. Processing...');
      } else {
        setStatus('Upload failed.');
      }
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (status === 'Uploaded. Processing...') {
      const interval = setInterval(async () => {
        const res = await fetch(`/status?image_id=${imageId}`);
        const data = await res.json();

        if (data.status === 'success') {
          const predictedIndex = data.result;
          console.log(predictedIndex);
          const predictedLabel = categories[predictedIndex];
          setResult(predictedLabel);
          console.log(predictedLabel);

          try {
            const nutritionRes = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(labelToQuery[predictedLabel])}&dataType=Foundation&api_key=rKORk0XKxfMVoB6CKzRj5XKPZwCwIwkRDvUEIOzt`);
            const nutritionData = await nutritionRes.json();

            const foodNutrients = nutritionData.foods?.[0]?.foodNutrients || [];
            const filteredNutrients = foodNutrients.filter(nutrient => importantNutrients.includes(nutrient.nutrientName));
            setNutrients(filteredNutrients);
          } catch (nutritionError) {
            console.error('Error fetching nutrition:', nutritionError);
          }

          setStatus('Processing complete.');
          setShowPopup(true);
          clearInterval(interval);
        } else if (data.status === 'failure') {
          setError(data.error);
          setStatus('Processing failed.');
          setShowPopup(true);
          clearInterval(interval);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [status, imageId]);

  return (
    <main className="min-h-screen bg-white px-6 py-12 flex flex-col items-center justify-center relative">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">🍜 Food Inference</h1>

      <div className="text-gray-600 mb-4">Supported Categories:</div>
      <ul className="text-sm text-gray-500 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mb-6 text-center">
        {categories.map((cat, idx) => (
          <li key={idx} className="bg-gray-100 px-3 py-1 rounded-full">{cat}</li>
        ))}
      </ul>

      <h2 className="text-lg font-bold text-gray-800 mb-4 mt-6">Upload the food item image</h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4 mt-2"
      />

      <button
        onClick={handleUpload}
        className="bg-blue-600 hover:bg-blue-700 text-white mt-2 px-6 py-2 rounded-full transition-all shadow-md"
      >
        Upload & Infer
      </button>

      <p className="text-lg mt-4">{status}</p>

      {status === 'Uploaded. Processing...' && (
        <div className="mt-6">
          <BounceLoader color="#0ea5e9" size={50} />
        </div>
      )}

      {/* Result / Error Pop-up */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-sm w-full animate-fade-in">
            {result && (
              <>
                <h3 className="text-2xl font-bold text-gray-600 mb-4">
                  Food Item Identified!
                </h3>
                <p className="text-gray-700 text-lg">The food item you uploaded is:</p>
                <p className="mt-2 text-xl font-semibold text-blue-500">{result}</p>

                {/* Nutrients Table */}
                {nutrients.length > 0 && (
  <div className="mt-6">
    <h4 className="text-lg font-bold text-gray-800 mb-2">Nutritional Information:</h4>
    <div className="grid grid-cols-1 gap-y-2 text-sm text-gray-700 text-left">
      {nutrients
        .filter((nutrient, index, self) =>
          nutrient.unitName === 'KCAL' || nutrient.unitName === 'G' || nutrient.unitName === 'MG'
        )
        .filter((nutrient, index, self) =>
          index === self.findIndex(n => n.nutrientName === nutrient.nutrientName)
        )
        .map((nutrient, idx) => (
          <div key={idx} className="flex justify-between border-b pb-1">
            <div className="w-2/3 pr-2 break-words">{nutrient.nutrientName}</div>
            <div className="w-1/3 text-right">{nutrient.value} {nutrient.unitName}</div>
          </div>
        ))}
    </div>
  </div>
)}
              </>
            )}
            {error && (
              <>
                <h3 className="text-2xl font-bold text-red-600 mb-4">❌ Error</h3>
                <p className="text-gray-700 text-md">{error}</p>
              </>
            )}
            <button
              onClick={() => setShowPopup(false)}
              className="mt-6 bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}












// 'use client';

// import { useState, useEffect } from 'react';
// import { BounceLoader } from 'react-spinners';

// const categories = [
//   'Bread', 'Dairy product', 'Dessert', 'Egg', 'Fried food', 'Meat',
//   'Noodles-Pasta', 'Rice', 'Seafood', 'Soup', 'Vegetable-Fruit'
// ];

// export default function InferencePage() {
//   const [file, setFile] = useState(null);
//   const [imageId, setImageId] = useState('');
//   const [status, setStatus] = useState('');
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState(null);
//   const [showPopup, setShowPopup] = useState(false);

//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//     setImageId(Date.now().toString());
//     setStatus('');
//     setResult(null);
//     setError(null);
//     setShowPopup(false);
//   };

//   const handleUpload = async () => {
//     if (!file) return;
//     const reader = new FileReader();

//     reader.onloadend = async () => {
//       const base64String = reader.result.split(',')[1];

//       const response = await fetch('https://lvxlr34bfb.execute-api.us-east-2.amazonaws.com/dev-stage/image-upload', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ image_id: imageId, image_data: base64String })
//       });

//       if (response.ok) {
//         setStatus('Uploaded. Processing...');
//       } else {
//         setStatus('Upload failed.');
//       }
//     };

//     reader.readAsDataURL(file);
//   };

//   useEffect(() => {
//     if (status === 'Uploaded. Processing...') {
//       const interval = setInterval(async () => {
//         const res = await fetch(`/status?image_id=${imageId}`);
//         const data = await res.json();

//         if (data.status === 'success') {
//           setResult(categories[data.result]);
//           console.log(categories[data.result]);
//           setStatus('Processing complete.');
//           setShowPopup(true);
//           clearInterval(interval);
//         } else if (data.status === 'failure') {
//           setError(data.error);
//           setStatus('Processing failed.');
//           setShowPopup(true);
//           clearInterval(interval);
//         }
//       }, 3000);

//       return () => clearInterval(interval);
//     }
//   }, [status, imageId]);

//   return (
//     <main className="min-h-screen bg-white px-6 py-12 flex flex-col items-center justify-center relative">
//       <h1 className="text-4xl font-bold text-gray-800 mb-6">🍜 Food Inference</h1>

//       <div className="text-gray-600 mb-4">Supported Categories:</div>
//       <ul className="text-sm text-gray-500 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mb-6 text-center">
//         {categories.map((cat, idx) => (
//           <li key={idx} className="bg-gray-100 px-3 py-1 rounded-full">{cat}</li>
//         ))}
//       </ul>

//       <h2 className="text-lg font-bold text-gray-800 mb-4 mt-6">Upload the food item image</h2>

//       <input
//         type="file"
//         accept="image/*"
//         onChange={handleFileChange}
//         className="mb-4 mt-2"
//       />

//       <button
//         onClick={handleUpload}
//         className="bg-blue-600 hover:bg-blue-700 text-white mt-2 px-6 py-2 rounded-full transition-all shadow-md"
//       >
//         Upload & Infer
//       </button>

//       <p className="text-lg mt-4">{status}</p>

//       {status === 'Uploaded. Processing...' && (
//         <div className="mt-6">
//           <BounceLoader color="#0ea5e9" size={50} />
//         </div>
//       )}

//       {/* Result / Error Pop-up */}
//       {showPopup && (
//         <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50">
//           <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-sm w-full animate-fade-in">
//             {result && (
//               <>
//                 <h3 className="text-2xl font-bold text-gray-600 mb-4">
//                   Food Item Identified!
//                 </h3>
//                 <p className="text-gray-700 text-lg">The food item you uploaded is a:</p>
//                 <p className="mt-2 text-xl font-semibold text-blue-500">{result}</p>
//               </>
//             )}
//             {error && (
//               <>
//                 <h3 className="text-2xl font-bold text-red-600 mb-4">❌ Error</h3>
//                 <p className="text-gray-700 text-md">{error}</p>
//               </>
//             )}
//             <button
//               onClick={() => setShowPopup(false)}
//               className="mt-6 bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }