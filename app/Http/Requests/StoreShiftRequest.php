<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreShiftRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole('Admin') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100|unique:shifts,name',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'break_duration_minutes' => 'nullable|integer|min:0|max:120',
            'overtime_limit_minutes' => 'nullable|integer|min:1|max:480',
            'color' => 'nullable|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active' => 'nullable|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Please enter a shift name.',
            'name.unique' => 'A shift with this name already exists.',
            'start_time.required' => 'Shift start time is required.',
            'start_time.date_format' => 'Start time must be in HH:MM format.',
            'end_time.required' => 'Shift end time is required.',
            'end_time.date_format' => 'End time must be in HH:MM format.',
            'break_duration_minutes.integer' => 'Break duration must be a valid number of minutes.',
            'break_duration_minutes.min' => 'Break duration cannot be negative.',
            'break_duration_minutes.max' => 'Break duration cannot exceed 120 minutes (2 hours).',
            'overtime_limit_minutes.integer' => 'Overtime limit must be a valid number of minutes.',
            'overtime_limit_minutes.min' => 'Overtime limit must be at least 1 minute.',
            'overtime_limit_minutes.max' => 'Overtime limit cannot exceed 480 minutes (8 hours).',
            'color.regex' => 'Color must be a valid 6-character hex code starting with #.',
        ];
    }
}
