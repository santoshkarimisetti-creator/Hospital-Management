from rest_framework import serializers
from apps.members.models import Member, Relationship


class MemberSerializer(serializers.ModelSerializer):
    relationship_type = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = (
            'id', 'user', 'full_name', 'gender', 'date_of_birth', 'age',
            'phone', 'address', 'custom_relation', 'relationship_type',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def get_relationship_type(self, obj):
        if obj.custom_relation:
            return obj.custom_relation
        rel = Relationship.objects.filter(member=obj).first()
        if rel:
            return rel.custom_relation or rel.get_relationship_type_display()
        return 'Self'
