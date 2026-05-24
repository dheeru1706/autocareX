import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/validators.dart';

class AddVehicleScreen extends ConsumerStatefulWidget {
  final String? vehicleId;
  const AddVehicleScreen({super.key, this.vehicleId});

  @override
  ConsumerState<AddVehicleScreen> createState() => _AddVehicleScreenState();
}

class _AddVehicleScreenState extends ConsumerState<AddVehicleScreen> {
  final _formKey = GlobalKey<FormState>();
  final _regController = TextEditingController();

  String? _selectedMake;
  String? _selectedModel;
  String? _selectedYear;
  String _selectedFuel = 'Petrol';
  String _selectedType = 'Hatchback';
  DateTime? _insuranceExpiry;
  final List<String> _uploadedImages = [];
  bool _isLoading = false;

  static const List<String> _makes = [
    'Maruti Suzuki',
    'Hyundai',
    'Tata',
    'Mahindra',
    'Honda',
    'Toyota',
    'Kia',
    'MG',
    'Volkswagen',
    'Skoda',
    'BMW',
    'Mercedes-Benz',
    'Audi',
    'Jeep',
    'Ford',
    'Others',
  ];

  static const Map<String, List<String>> _modelsByMake = {
    'Maruti Suzuki': [
      'Swift', 'Baleno', 'Dzire', 'Alto', 'Ertiga', 'Brezza', 'Ciaz', 'S-Cross'
    ],
    'Hyundai': [
      'Creta', 'i20', 'Venue', 'Verna', 'Tucson', 'Exter', 'Alcazar', 'Ioniq 5'
    ],
    'Tata': [
      'Nexon', 'Punch', 'Harrier', 'Safari', 'Tiago', 'Tigor', 'Altroz', 'Nexon EV'
    ],
    'Mahindra': [
      'XUV700', 'Scorpio N', 'Thar', 'XUV300', 'Bolero', 'BE 6e', 'XEV 9e'
    ],
    'Honda': ['City', 'Amaze', 'Elevate', 'WR-V'],
    'Toyota': ['Fortuner', 'Innova Crysta', 'Urban Cruiser Hyryder', 'Camry'],
    'Kia': ['Seltos', 'Sonet', 'Carens', 'EV6'],
    'Others': ['Others'],
  };

  static const List<String> _fuels = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
  static const List<String> _types = [
    'Hatchback', 'Sedan', 'SUV', 'MUV', 'Crossover', 'Coupe', 'Convertible',
  ];

  List<String> get _availableYears {
    final current = DateTime.now().year;
    return List.generate(
      current - 1990 + 2,
      (i) => (current + 1 - i).toString(),
    );
  }

  List<String> get _models =>
      _selectedMake != null
          ? (_modelsByMake[_selectedMake!] ?? ['Others'])
          : [];

  Future<void> _pickImage() async {
    if (_uploadedImages.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 5 photos allowed')),
      );
      return;
    }

    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );

    if (image != null) {
      setState(() => _uploadedImages.add(image.path));
    }
  }

  Future<void> _selectInsuranceDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _insuranceExpiry ??
          DateTime.now().add(const Duration(days: 365)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.dark(
            primary: AppColors.primary,
            onPrimary: Colors.black,
            surface: AppColors.card,
          ),
        ),
        child: child!,
      ),
    );

    if (date != null) {
      setState(() => _insuranceExpiry = date);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(seconds: 1));

    if (mounted) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vehicle added successfully!'),
          backgroundColor: AppColors.success,
        ),
      );
      context.pop();
    }
  }

  @override
  void dispose() {
    _regController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.vehicleId != null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(isEdit ? 'Edit Vehicle' : 'Add Vehicle'),
        actions: [
          if (isEdit)
            IconButton(
              icon: const Icon(Icons.delete_outline_rounded,
                  color: AppColors.error),
              onPressed: () => _showDeleteDialog(),
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Photo upload section
              _buildPhotoSection(),

              const SizedBox(height: 24),

              // Vehicle Details
              _SectionTitle('Vehicle Details'),
              const SizedBox(height: 16),

              // Make dropdown
              _buildDropdown(
                label: 'Make / Brand',
                value: _selectedMake,
                items: _makes,
                onChanged: (v) => setState(() {
                  _selectedMake = v;
                  _selectedModel = null;
                }),
                hint: 'Select make',
                icon: Icons.directions_car_rounded,
              ),

              const SizedBox(height: 14),

              // Model dropdown
              _buildDropdown(
                label: 'Model',
                value: _selectedModel,
                items: _models,
                onChanged: (v) => setState(() => _selectedModel = v),
                hint: _selectedMake == null
                    ? 'Select make first'
                    : 'Select model',
                icon: Icons.time_to_leave_rounded,
                enabled: _selectedMake != null,
              ),

              const SizedBox(height: 14),

              // Year dropdown
              _buildDropdown(
                label: 'Year',
                value: _selectedYear,
                items: _availableYears,
                onChanged: (v) => setState(() => _selectedYear = v),
                hint: 'Select year',
                icon: Icons.calendar_today_rounded,
              ),

              const SizedBox(height: 14),

              // Registration number
              TextFormField(
                controller: _regController,
                textCapitalization: TextCapitalization.characters,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(
                      RegExp(r'[A-Za-z0-9\s]')),
                  UpperCaseTextFormatter(),
                ],
                decoration: InputDecoration(
                  labelText: 'Registration Number',
                  hintText: 'MH 01 AB 1234',
                  prefixIcon: const Icon(Icons.badge_rounded, size: 20),
                ),
                validator: Validators.vehicleRegistration,
              ),

              const SizedBox(height: 24),

              // Fuel Type
              _SectionTitle('Fuel Type'),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _fuels.map((fuel) {
                  final isSelected = _selectedFuel == fuel;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedFuel = fuel),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.primary.withOpacity(0.2)
                            : AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.border,
                          width: isSelected ? 1.5 : 0.5,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _fuelIcon(fuel),
                            size: 16,
                            color: isSelected
                                ? AppColors.primary
                                : AppColors.textSecondary,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            fuel,
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 13,
                              fontWeight: isSelected
                                  ? FontWeight.w700
                                  : FontWeight.w400,
                              color: isSelected
                                  ? AppColors.primary
                                  : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 24),

              // Vehicle Type
              _SectionTitle('Vehicle Type'),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _types.map((type) {
                  final isSelected = _selectedType == type;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedType = type),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 9),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.primary.withOpacity(0.2)
                            : AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.border,
                          width: isSelected ? 1.5 : 0.5,
                        ),
                      ),
                      child: Text(
                        type,
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 13,
                          fontWeight: isSelected
                              ? FontWeight.w700
                              : FontWeight.w400,
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.textSecondary,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 24),

              // Insurance Expiry
              _SectionTitle('Insurance Expiry (Optional)'),
              const SizedBox(height: 12),
              GestureDetector(
                onTap: _selectInsuranceDate,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border, width: 0.5),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.shield_rounded,
                          color: AppColors.textSecondary, size: 20),
                      const SizedBox(width: 12),
                      Text(
                        _insuranceExpiry != null
                            ? '${_insuranceExpiry!.day}/${_insuranceExpiry!.month}/${_insuranceExpiry!.year}'
                            : 'Select expiry date',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 14,
                          color: _insuranceExpiry != null
                              ? AppColors.textPrimary
                              : AppColors.textHint,
                        ),
                      ),
                      const Spacer(),
                      const Icon(Icons.calendar_today_rounded,
                          size: 18, color: AppColors.textSecondary),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Save button
              ElevatedButton(
                onPressed: _isLoading ? null : _save,
                style: ElevatedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 56)),
                child: _isLoading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          color: Colors.black,
                          strokeWidth: 2.5,
                        ),
                      )
                    : Text(
                        isEdit ? 'Update Vehicle' : 'Add Vehicle',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhotoSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        _SectionTitle('Photos (up to 5)'),
        const SizedBox(height: 12),
        SizedBox(
          height: 90,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              // Add photo button
              GestureDetector(
                onTap: _pickImage,
                child: Container(
                  width: 80,
                  height: 80,
                  margin: const EdgeInsets.only(right: 10),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: AppColors.primary.withOpacity(0.4),
                        width: 1,
                        style: BorderStyle.solid),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.add_photo_alternate_rounded,
                          color: AppColors.primary, size: 28),
                      const SizedBox(height: 4),
                      Text(
                        'Add',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Uploaded images
              ..._uploadedImages.asMap().entries.map((entry) {
                return Stack(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      margin: const EdgeInsets.only(right: 10),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: AppColors.border, width: 0.5),
                      ),
                      child: const Icon(Icons.image_rounded,
                          color: AppColors.textHint, size: 32),
                    ),
                    Positioned(
                      top: 4,
                      right: 14,
                      child: GestureDetector(
                        onTap: () => setState(
                            () => _uploadedImages.removeAt(entry.key)),
                        child: Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: AppColors.error,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.close,
                              size: 12, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                );
              }),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required String label,
    required String? value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
    required String hint,
    required IconData icon,
    bool enabled = true,
  }) {
    return DropdownButtonFormField<String>(
      value: value,
      onChanged: enabled ? onChanged : null,
      dropdownColor: AppColors.card,
      style: const TextStyle(
        fontFamily: 'Inter',
        color: AppColors.textPrimary,
        fontSize: 14,
      ),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 20),
        filled: true,
        fillColor: enabled ? AppColors.surface : AppColors.surface.withOpacity(0.5),
      ),
      hint: Text(hint,
          style: const TextStyle(color: AppColors.textHint, fontSize: 14)),
      items: items.map((item) {
        return DropdownMenuItem(
          value: item,
          child: Text(item),
        );
      }).toList(),
    );
  }

  IconData _fuelIcon(String fuel) {
    switch (fuel) {
      case 'Electric':
        return Icons.electric_bolt_rounded;
      case 'CNG':
        return Icons.propane_tank_rounded;
      case 'Diesel':
        return Icons.local_gas_station_rounded;
      case 'Hybrid':
        return Icons.eco_rounded;
      default:
        return Icons.local_gas_station_outlined;
    }
  }

  void _showDeleteDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.card,
        title: const Text('Remove Vehicle'),
        content: const Text(
            'Are you sure you want to remove this vehicle?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.pop();
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
    );
  }
}

class UpperCaseTextFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    return newValue.copyWith(text: newValue.text.toUpperCase());
  }
}
