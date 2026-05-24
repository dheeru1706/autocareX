import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../../core/theme/app_theme.dart';

class SellCarScreen extends StatefulWidget {
  const SellCarScreen({super.key});

  @override
  State<SellCarScreen> createState() => _SellCarScreenState();
}

class _SellCarScreenState extends State<SellCarScreen> {
  int _currentStep = 0;
  final _formKey = GlobalKey<FormState>();
  final _makeController = TextEditingController();
  final _modelController = TextEditingController();
  final _yearController = TextEditingController();
  final _mileageController = TextEditingController();
  final _priceController = TextEditingController();
  final _descController = TextEditingController();
  String _selectedFuel = 'petrol';
  String _selectedCondition = 'good';
  List<File> _images = [];
  double? _aiEstimatedPrice;

  final List<String> _fuels = ['petrol', 'diesel', 'cng', 'electric', 'hybrid'];
  final List<String> _conditions = ['excellent', 'good', 'fair', 'poor'];

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final picked = await picker.pickMultiImage(imageQuality: 80);
    if (picked.isNotEmpty) {
      setState(() {
        _images = [..._images, ...picked.map((x) => File(x.path))].take(8).toList();
      });
    }
  }

  void _estimateAIPrice() {
    // Simulate AI price estimation
    final year = int.tryParse(_yearController.text) ?? 2020;
    final mileage = int.tryParse(_mileageController.text) ?? 50000;
    final ageFactor = (2026 - year) * 0.08;
    final mileageFactor = mileage / 100000 * 0.1;
    final conditionFactor = {'excellent': 0.0, 'good': 0.05, 'fair': 0.12, 'poor': 0.20}[_selectedCondition]!;
    double base = 800000;
    final estimated = base * (1 - ageFactor - mileageFactor - conditionFactor);
    setState(() { _aiEstimatedPrice = estimated.clamp(50000, 5000000); });
    _priceController.text = estimated.round().toString();
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0: return _buildVehicleDetails();
      case 1: return _buildPhotoUpload();
      case 2: return _buildPricing();
      case 3: return _buildInspectionSchedule();
      case 4: return _buildReview();
      default: return const SizedBox();
    }
  }

  Widget _buildVehicleDetails() {
    return Column(children: [
      _buildInput(_makeController, 'Car Make', 'e.g. Maruti Suzuki'),
      const SizedBox(height: 16),
      _buildInput(_modelController, 'Car Model', 'e.g. Swift Dzire'),
      const SizedBox(height: 16),
      _buildInput(_yearController, 'Year of Manufacture', '2020', keyboardType: TextInputType.number),
      const SizedBox(height: 16),
      _buildInput(_mileageController, 'Total Mileage (km)', '45000', keyboardType: TextInputType.number),
      const SizedBox(height: 20),
      _buildLabel('Fuel Type'),
      const SizedBox(height: 8),
      Wrap(spacing: 8, children: _fuels.map((f) => ChoiceChip(
        label: Text(f.toUpperCase(), style: TextStyle(fontSize: 12, color: _selectedFuel == f ? Colors.black : Colors.white)),
        selected: _selectedFuel == f,
        selectedColor: AppColors.primary,
        backgroundColor: AppColors.card,
        onSelected: (_) => setState(() => _selectedFuel = f),
      )).toList()),
      const SizedBox(height: 20),
      _buildLabel('Vehicle Condition'),
      const SizedBox(height: 8),
      Wrap(spacing: 8, children: _conditions.map((c) => ChoiceChip(
        label: Text(c[0].toUpperCase() + c.substring(1), style: TextStyle(fontSize: 12, color: _selectedCondition == c ? Colors.black : Colors.white)),
        selected: _selectedCondition == c,
        selectedColor: _selectedCondition == c ? {'excellent': const Color(0xFF00C853), 'good': AppColors.primary, 'fair': Colors.orange, 'poor': Colors.red}[c] : AppColors.primary,
        backgroundColor: AppColors.card,
        onSelected: (_) => setState(() => _selectedCondition = c),
      )).toList()),
    ]);
  }

  Widget _buildPhotoUpload() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Add Photos', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
      const SizedBox(height: 4),
      Text('Add up to 8 photos. Include front, back, interior, odometer.', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
      const SizedBox(height: 16),
      GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 8, mainAxisSpacing: 8),
        itemCount: _images.length + (_images.length < 8 ? 1 : 0),
        itemBuilder: (ctx, i) {
          if (i == _images.length) {
            return GestureDetector(
              onTap: _pickImages,
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.primary, style: BorderStyle.solid),
                  borderRadius: BorderRadius.circular(12),
                  color: AppColors.card,
                ),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.add_photo_alternate, color: AppColors.primary, size: 28),
                  const SizedBox(height: 4),
                  Text('Add Photo', style: TextStyle(color: AppColors.primary, fontSize: 11)),
                ]),
              ),
            );
          }
          return ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Stack(fit: StackFit.expand, children: [
              Image.file(_images[i], fit: BoxFit.cover),
              Positioned(top: 4, right: 4, child: GestureDetector(
                onTap: () => setState(() => _images.removeAt(i)),
                child: Container(
                  decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                  padding: const EdgeInsets.all(2),
                  child: const Icon(Icons.close, color: Colors.white, size: 14),
                ),
              )),
            ]),
          );
        },
      ),
      const SizedBox(height: 16),
      _buildTip('📸 Good photos get 3x more inquiries. Shoot in natural light.'),
    ]);
  }

  Widget _buildPricing() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Set Your Price', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
      const SizedBox(height: 16),
      ElevatedButton.icon(
        onPressed: _estimateAIPrice,
        icon: const Icon(Icons.auto_awesome, size: 18),
        label: const Text('Get AI Price Estimate'),
        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.black),
      ),
      if (_aiEstimatedPrice != null) ...[
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.primary.withOpacity(0.3)),
          ),
          child: Row(children: [
            const Icon(Icons.psychology, color: Color(0xFFF5C518)),
            const SizedBox(width: 12),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('AI Estimated Price', style: TextStyle(color: Colors.white70, fontSize: 12)),
              Text('₹${(_aiEstimatedPrice! * 0.95).round().toStringAsFixed(0)} – ₹${(_aiEstimatedPrice! * 1.05).round().toStringAsFixed(0)}',
                style: const TextStyle(color: Color(0xFFF5C518), fontSize: 16, fontWeight: FontWeight.bold)),
            ]),
          ]),
        ),
      ],
      const SizedBox(height: 16),
      _buildInput(_priceController, 'Your Asking Price (₹)', '750000', keyboardType: TextInputType.number, prefix: '₹'),
      const SizedBox(height: 16),
      _buildInput(_descController, 'Description (optional)', 'Well-maintained, single owner...', maxLines: 3),
      const SizedBox(height: 12),
      _buildTip('💡 Prices within 10% of AI estimate sell 40% faster.'),
    ]);
  }

  Widget _buildInspectionSchedule() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Schedule Inspection', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
      const SizedBox(height: 8),
      Text('A free inspection boosts buyer confidence and helps you get a better price.',
        style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
      const SizedBox(height: 24),
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(16)),
        child: Column(children: [
          Icon(Icons.fact_check, color: AppColors.primary, size: 40),
          const SizedBox(height: 12),
          const Text('Free AutoCareX Inspection', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Text('150-point inspection report\nHigh-trust score badge on your listing\nFree for all sellers',
            textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          const SizedBox(height: 16),
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.black, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('SCHEDULE FREE INSPECTION'),
          )),
          TextButton(onPressed: () => setState(() => _currentStep = 4), child: Text('Skip for now', style: TextStyle(color: AppColors.textSecondary))),
        ]),
      ),
    ]);
  }

  Widget _buildReview() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Review & Submit', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
      const SizedBox(height: 16),
      _reviewRow('Make & Model', '${_makeController.text} ${_modelController.text}'),
      _reviewRow('Year', _yearController.text),
      _reviewRow('Mileage', '${_mileageController.text} km'),
      _reviewRow('Fuel Type', _selectedFuel),
      _reviewRow('Condition', _selectedCondition),
      _reviewRow('Asking Price', '₹${_priceController.text}'),
      _reviewRow('Photos', '${_images.length} uploaded'),
      const SizedBox(height: 16),
      _buildTip('📋 Your listing will be reviewed within 24 hours before going live.'),
    ]);
  }

  Widget _reviewRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500)),
      ]),
    );
  }

  Widget _buildLabel(String text) {
    return Text(text, style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500));
  }

  Widget _buildInput(TextEditingController controller, String label, String hint, {TextInputType keyboardType = TextInputType.text, int maxLines = 1, String? prefix}) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _buildLabel(label),
      const SizedBox(height: 6),
      TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        maxLines: maxLines,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: AppColors.textSecondary),
          prefixText: prefix,
          prefixStyle: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
          filled: true,
          fillColor: AppColors.card,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white12)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.primary)),
        ),
      ),
    ]);
  }

  Widget _buildTip(String text) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
      child: Text(text, style: const TextStyle(color: Colors.white70, fontSize: 12)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final steps = ['Details', 'Photos', 'Pricing', 'Inspection', 'Review'];
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: const Text('Sell Your Car', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: () => Navigator.pop(context)),
      ),
      body: Column(children: [
        // Progress bar
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: List.generate(steps.length, (i) => Expanded(child: Container(
            height: 4,
            margin: const EdgeInsets.symmetric(horizontal: 2),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(2),
              color: i <= _currentStep ? AppColors.primary : Colors.white12,
            ),
          )))),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Step ${_currentStep + 1} of ${steps.length}', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            Text(steps[_currentStep], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          ]),
        ),
        const SizedBox(height: 8),
        Expanded(child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: _buildStepContent().animate().fadeIn(duration: 300.ms).slideX(begin: 0.1, end: 0),
        )),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            if (_currentStep > 0) Expanded(child: OutlinedButton(
              onPressed: () => setState(() => _currentStep--),
              style: OutlinedButton.styleFrom(side: BorderSide(color: AppColors.primary), foregroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: const Text('BACK'),
            )),
            if (_currentStep > 0) const SizedBox(width: 12),
            Expanded(flex: 2, child: ElevatedButton(
              onPressed: () {
                if (_currentStep < steps.length - 1) {
                  setState(() => _currentStep++);
                } else {
                  // Submit listing
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Listing submitted for review!')));
                  Navigator.pop(context);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(_currentStep == steps.length - 1 ? 'SUBMIT LISTING' : 'CONTINUE', style: const TextStyle(fontWeight: FontWeight.bold)),
            )),
          ]),
        ),
      ]),
    );
  }
}
