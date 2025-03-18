document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('chessboard-image');
    const submitBtn = document.getElementById('submit-btn');
    const previewContainer = document.querySelector('.preview-container');
    const previewImage = document.getElementById('preview-image');
    const loading = document.querySelector('.loading');
    const resultContainer = document.querySelector('.result-container');
    const moveSuggestion = document.getElementById('move-suggestion');
    const errorMessage = document.getElementById('error-message');

    fileInput.addEventListener('change', function (e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = function (e) {
                previewImage.src = e.target.result;
                previewContainer.style.display = 'block';
                submitBtn.style.display = 'block';
                resultContainer.style.display = 'none';
                errorMessage.style.display = 'none';
            };

            reader.readAsDataURL(file);
        }
    });

    submitBtn.addEventListener('click', function () {
        if (fileInput.files.length === 0) {
            alert('Please select an image first!');
            return;
        }

        loading.style.display = 'block';
        submitBtn.disabled = true;
        resultContainer.style.display = 'none';
        errorMessage.style.display = 'none';

        const formData = new FormData();
        formData.append('chessboard', fileInput.files[0]);

        fetch('/api/chess-assistant', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Server error');
                }
                return response.json();
            })
            .then(data => {
                loading.style.display = 'none';
                resultContainer.style.display = 'block';
                moveSuggestion.textContent = data.suggestion;
                submitBtn.disabled = false;
            })
            .catch(error => {
                console.error('Error:', error);
                loading.style.display = 'none';
                errorMessage.style.display = 'block';
                submitBtn.disabled = false;
            });
    });
});
